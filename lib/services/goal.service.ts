import { prisma } from '@/lib/db';
import { WorkspaceService } from './workspace.service';
import { AppError, NotFoundError } from '@/lib/errors';
import { GoalStatus } from '@prisma/client';

export class GoalService {
  /**
   * Create a goal in a workspace (optionally linked to a project).
   */
  static async createGoal(
    userId: string,
    workspaceId: string,
    data: {
      name: string;
      description?: string;
      projectId?: string;
      ownerId?: string;
      startDate?: Date;
      targetDate?: Date;
      metrics?: string;
    }
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER']);

    // Validate linked project belongs to this workspace
    if (data.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: data.projectId, workspaceId },
      });
      if (!project) throw new NotFoundError('Project not found');
    }

    // Validate owner is a workspace member
    const ownerId = data.ownerId ?? userId;
    await WorkspaceService.verifyAccess(ownerId, workspaceId);

    return prisma.goal.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description,
        projectId: data.projectId,
        ownerId,
        startDate: data.startDate,
        targetDate: data.targetDate,
        metrics: data.metrics,
        status: 'NOT_STARTED',
        progress: 0,
      },
    });
  }

  /**
   * List all goals in a workspace (optionally filtered by project).
   */
  static async listGoals(userId: string, workspaceId: string, projectId?: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    return prisma.goal.findMany({
      where: {
        workspaceId,
        ...(projectId ? { projectId } : {}),
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { targetDate: 'asc' },
    });
  }

  /**
   * Get a single goal.
   */
  static async getGoal(userId: string, workspaceId: string, goalId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const goal = await prisma.goal.findUnique({
      where: { id: goalId, workspaceId },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!goal) throw new NotFoundError('Goal not found');

    return goal;
  }

  /**
   * Update goal name, description, dates, owner, or metrics.
   */
  static async updateGoal(
    userId: string,
    workspaceId: string,
    goalId: string,
    data: {
      name?: string;
      description?: string;
      ownerId?: string;
      startDate?: Date;
      targetDate?: Date;
      metrics?: string;
    }
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER']);

    const goal = await prisma.goal.findUnique({ where: { id: goalId, workspaceId } });
    if (!goal) throw new NotFoundError('Goal not found');

    if (data.ownerId) {
      await WorkspaceService.verifyAccess(data.ownerId, workspaceId);
    }

    return prisma.goal.update({ where: { id: goalId }, data });
  }

  /**
   * Update goal progress (0–100) and derive status automatically.
   */
  static async updateProgress(
    userId: string,
    workspaceId: string,
    goalId: string,
    progress: number
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    if (progress < 0 || progress > 100) {
      throw new AppError('Progress must be between 0 and 100', 'VALIDATION_ERROR', 400);
    }

    const goal = await prisma.goal.findUnique({ where: { id: goalId, workspaceId } });
    if (!goal) throw new NotFoundError('Goal not found');

    // Auto-derive status from progress and deadline
    let status: GoalStatus = goal.status;
    if (progress === 100) {
      status = 'COMPLETED';
    } else if (progress === 0) {
      status = 'NOT_STARTED';
    } else if (goal.targetDate && new Date() > new Date(goal.targetDate)) {
      status = 'AT_RISK';
    } else {
      status = 'ON_TRACK';
    }

    return prisma.goal.update({
      where: { id: goalId },
      data: { progress, status },
    });
  }

  /**
   * Explicitly set the status (e.g., to mark AT_RISK manually).
   */
  static async setStatus(
    userId: string,
    workspaceId: string,
    goalId: string,
    status: GoalStatus
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER']);

    const goal = await prisma.goal.findUnique({ where: { id: goalId, workspaceId } });
    if (!goal) throw new NotFoundError('Goal not found');

    return prisma.goal.update({ where: { id: goalId }, data: { status } });
  }

  /**
   * Delete a goal.
   */
  static async deleteGoal(userId: string, workspaceId: string, goalId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN']);

    const goal = await prisma.goal.findUnique({ where: { id: goalId, workspaceId } });
    if (!goal) throw new NotFoundError('Goal not found');

    return prisma.goal.delete({ where: { id: goalId } });
  }
}
