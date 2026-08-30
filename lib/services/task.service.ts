import { prisma } from '@/lib/db';
import { WorkspaceService } from './workspace.service';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { TaskStatus, Priority } from '@prisma/client';

interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class TaskService {
  /**
   * List paginated tasks for a project with complex filtering and searching
   */
  static async listTasks(userId: string, workspaceId: string, projectId: string, filters: TaskFilters) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    // Ensure project belongs to workspace
    const project = await prisma.project.findUnique({ where: { id: projectId, workspaceId } });
    if (!project) throw new NotFoundError('Project not found');

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      projectId,
      workspaceId,
      parentId: null, // By default, only show root tasks in main list
    };

    if (filters.status) whereClause.status = filters.status;
    if (filters.priority) whereClause.priority = filters.priority;
    if (filters.search) {
      whereClause.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.assigneeId) {
      whereClause.assignees = {
        some: { userId: filters.assigneeId },
      };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { position: 'asc' },
        include: {
          assignees: { include: { user: { select: { id: true, name: true, email: true } } } },
          labels: { include: { label: true } },
          _count: { select: { subtasks: true, comments: true } }
        },
      }),
      prisma.task.count({ where: whereClause }),
    ]);

    return {
      data: tasks,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get single task details including subtasks
   */
  static async getTask(userId: string, workspaceId: string, taskId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const task = await prisma.task.findUnique({
      where: { id: taskId, workspaceId },
      include: {
        subtasks: {
          orderBy: { position: 'asc' },
          include: { assignees: { include: { user: true } } }
        },
        assignees: { include: { user: true } },
        labels: { include: { label: true } },
      },
    });

    if (!task) throw new NotFoundError('Task not found');
    return task;
  }

  /**
   * Create a task
   */
  static async createTask(userId: string, workspaceId: string, projectId: string, data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
    dueDate?: Date;
    storyPoints?: number;
    parentId?: string;
  }) {
    // Anyone in workspace can create a task
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const project = await prisma.project.findUnique({ where: { id: projectId, workspaceId } });
    if (!project) throw new NotFoundError('Project not found');

    if (data.parentId) {
      const parentTask = await prisma.task.findUnique({ where: { id: data.parentId, workspaceId } });
      if (!parentTask) throw new NotFoundError('Parent task not found');
    }

    // Determine position (last in list)
    const lastTask = await prisma.task.findFirst({
      where: { projectId, parentId: data.parentId || null },
      orderBy: { position: 'desc' },
      select: { position: true }
    });
    const position = lastTask ? lastTask.position + 1024 : 1024;

    return prisma.task.create({
      data: {
        ...data,
        projectId,
        workspaceId,
        reporterId: userId,
        position,
      },
    });
  }

  /**
   * Update task
   */
  static async updateTask(userId: string, workspaceId: string, taskId: string, data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
    dueDate?: Date;
    storyPoints?: number;
  }) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const task = await prisma.task.findUnique({ where: { id: taskId, workspaceId } });
    if (!task) throw new NotFoundError('Task not found');

    return prisma.task.update({
      where: { id: taskId },
      data,
    });
  }

  /**
   * Delete task
   */
  static async deleteTask(userId: string, workspaceId: string, taskId: string) {
    // Only OWNER, ADMIN, PM, or the original reporter can delete
    const member = await WorkspaceService.verifyAccess(userId, workspaceId);
    
    const task = await prisma.task.findUnique({ where: { id: taskId, workspaceId } });
    if (!task) throw new NotFoundError('Task not found');

    if (member.role === 'VIEWER' || (member.role === 'MEMBER' && task.reporterId !== userId)) {
      throw new ForbiddenError('You do not have permission to delete this task');
    }

    return prisma.task.delete({
      where: { id: taskId },
    });
  }

  /**
   * Assign user to task
   */
  static async assignTask(userId: string, workspaceId: string, taskId: string, assigneeId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'MEMBER']);
    
    // Verify assignee belongs to workspace
    await WorkspaceService.verifyAccess(assigneeId, workspaceId);

    const task = await prisma.task.findUnique({ where: { id: taskId, workspaceId } });
    if (!task) throw new NotFoundError('Task not found');

    return prisma.taskAssignee.create({
      data: {
        taskId,
        userId: assigneeId,
      }
    });
  }
}
