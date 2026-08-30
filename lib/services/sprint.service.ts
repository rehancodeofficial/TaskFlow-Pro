import { prisma } from '@/lib/db';
import { WorkspaceService } from './workspace.service';
import { AppError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { TaskStatus } from '@prisma/client';

export class SprintService {
  /**
   * Create a sprint
   */
  static async createSprint(userId: string, workspaceId: string, projectId: string, data: { name: string; goal?: string; startDate: Date; endDate: Date }) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER']);

    const project = await prisma.project.findUnique({ where: { id: projectId, workspaceId } });
    if (!project) throw new NotFoundError('Project not found');

    if (new Date(data.startDate) >= new Date(data.endDate)) {
      throw new AppError('Start date must be before end date', 'VALIDATION_ERROR', 400);
    }

    return prisma.sprint.create({
      data: {
        ...data,
        projectId,
        status: 'PLANNED',
      },
    });
  }

  /**
   * Start a sprint (Transition PLANNED -> ACTIVE)
   */
  static async startSprint(userId: string, workspaceId: string, sprintId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER']);

    const sprint = await prisma.sprint.findUnique({ where: { id: sprintId }, include: { project: true } });
    if (!sprint || sprint.project.workspaceId !== workspaceId) throw new NotFoundError('Sprint not found');

    if (sprint.status !== 'PLANNED') {
      throw new AppError(`Cannot start a sprint in ${sprint.status} state`, 'INVALID_TRANSITION', 400);
    }

    // Ensure only one active sprint exists for this project
    const activeSprints = await prisma.sprint.count({
      where: { projectId: sprint.projectId, status: 'ACTIVE' },
    });

    if (activeSprints > 0) {
      throw new AppError('An active sprint already exists for this project. Complete it before starting a new one.', 'ACTIVE_SPRINT_EXISTS', 400);
    }

    return prisma.sprint.update({
      where: { id: sprintId },
      data: { status: 'ACTIVE' },
    });
  }

  /**
   * Complete a sprint (Transition ACTIVE -> COMPLETED)
   */
  static async completeSprint(userId: string, workspaceId: string, sprintId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER']);

    const sprint = await prisma.sprint.findUnique({ where: { id: sprintId }, include: { project: true } });
    if (!sprint || sprint.project.workspaceId !== workspaceId) throw new NotFoundError('Sprint not found');

    if (sprint.status !== 'ACTIVE') {
      throw new AppError(`Cannot complete a sprint that is not ACTIVE`, 'INVALID_TRANSITION', 400);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Mark sprint as completed
      const completedSprint = await tx.sprint.update({
        where: { id: sprintId },
        data: { status: 'COMPLETED' },
      });

      // 2. Roll uncompleted tasks back to the project backlog
      await tx.task.updateMany({
        where: {
          sprintId,
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
        data: { sprintId: null },
      });

      return completedSprint;
    });
  }

  /**
   * Add tasks to sprint
   */
  static async addTasksToSprint(userId: string, workspaceId: string, sprintId: string, taskIds: string[]) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'MEMBER']);

    const sprint = await prisma.sprint.findUnique({ where: { id: sprintId }, include: { project: true } });
    if (!sprint || sprint.project.workspaceId !== workspaceId) throw new NotFoundError('Sprint not found');

    if (sprint.status === 'COMPLETED' || sprint.status === 'CANCELLED') {
      throw new AppError('Cannot add tasks to a closed sprint', 'INVALID_OPERATION', 400);
    }

    // Ensure all tasks belong to the same project
    const tasks = await prisma.task.findMany({ where: { id: { in: taskIds }, workspaceId } });
    const invalidTasks = tasks.filter(t => t.projectId !== sprint.projectId);
    
    if (invalidTasks.length > 0) {
      throw new AppError('All tasks must belong to the same project as the sprint', 'INVALID_OPERATION', 400);
    }

    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { sprintId },
    });

    return { success: true, count: tasks.length };
  }

  /**
   * Get Sprint Analytics (Progress, Velocity, Burndown)
   */
  static async getSprintAnalytics(userId: string, workspaceId: string, sprintId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const sprint = await prisma.sprint.findUnique({ 
      where: { id: sprintId }, 
      include: { 
        project: true,
        tasks: { select: { id: true, storyPoints: true, status: true, completedAt: true } }
      } 
    });

    if (!sprint || sprint.project.workspaceId !== workspaceId) throw new NotFoundError('Sprint not found');

    let totalPoints = 0;
    let completedPoints = 0;

    sprint.tasks.forEach(task => {
      const pts = task.storyPoints || 0;
      totalPoints += pts;
      if (task.status === 'DONE') {
        completedPoints += pts;
      }
    });

    const completionPercentage = totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0;

    // Simple Dynamic Burndown Calculation
    const burndown = [];
    let remaining = totalPoints;
    
    const start = new Date(sprint.startDate).getTime();
    const end = new Date(sprint.endDate).getTime();
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    const idealDailyBurn = totalPoints / days;

    for (let i = 0; i <= days; i++) {
      const date = new Date(start + i * 24 * 60 * 60 * 1000);
      
      // Calculate points completed up to this day
      const ptsCompletedToDate = sprint.tasks
        .filter(t => t.status === 'DONE' && t.completedAt && t.completedAt <= date)
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      burndown.push({
        date: date.toISOString().split('T')[0],
        ideal: Math.max(0, totalPoints - (idealDailyBurn * i)),
        actual: totalPoints - ptsCompletedToDate,
      });
    }

    return {
      totalPoints,
      completedPoints,
      remainingPoints: totalPoints - completedPoints,
      completionPercentage: Math.round(completionPercentage),
      burndown,
    };
  }
}
