import { prisma } from '@/lib/db';
import { WorkspaceService } from './workspace.service';
import { AppError, NotFoundError } from '@/lib/errors';

export class TimeTrackingService {
  /**
   * Start a timer for a task.
   * Prevents overlapping active timers for the same user.
   */
  static async startTimer(userId: string, workspaceId: string, taskId: string, description?: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    // Verify task belongs to this workspace
    const task = await prisma.task.findUnique({ where: { id: taskId, workspaceId } });
    if (!task) throw new NotFoundError('Task not found');

    // Prevent overlapping active timers — a user can only have one running timer at a time
    const activeTimer = await prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
    });

    if (activeTimer) {
      throw new AppError(
        'You already have an active timer running. Stop it before starting a new one.',
        'TIMER_ALREADY_RUNNING',
        400
      );
    }

    return prisma.timeEntry.create({
      data: {
        userId,
        taskId,
        startTime: new Date(),
        description,
      },
    });
  }

  /**
   * Stop the currently running timer for a user.
   */
  static async stopTimer(userId: string, workspaceId: string, entryId?: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const where = entryId
      ? { id: entryId, userId, endTime: null }
      : { userId, endTime: null };

    const activeEntry = await prisma.timeEntry.findFirst({ where });
    if (!activeEntry) throw new NotFoundError('No active timer found');

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - activeEntry.startTime.getTime()) / 60000); // minutes

    return prisma.timeEntry.update({
      where: { id: activeEntry.id },
      data: { endTime, duration },
    });
  }

  /**
   * Create a manual time entry (no start/stop flow).
   */
  static async createManualEntry(
    userId: string,
    workspaceId: string,
    data: {
      taskId: string;
      startTime: Date;
      endTime: Date;
      description?: string;
    }
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const task = await prisma.task.findUnique({ where: { id: data.taskId, workspaceId } });
    if (!task) throw new NotFoundError('Task not found');

    if (new Date(data.startTime) >= new Date(data.endTime)) {
      throw new AppError('Start time must be before end time', 'VALIDATION_ERROR', 400);
    }

    const duration = Math.round(
      (new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 60000
    );

    // Prevent overlapping with an existing active timer
    const activeTimer = await prisma.timeEntry.findFirst({ where: { userId, endTime: null } });
    if (activeTimer) {
      throw new AppError(
        'Stop your active timer before adding a manual entry.',
        'TIMER_ALREADY_RUNNING',
        400
      );
    }

    return prisma.timeEntry.create({
      data: {
        userId,
        taskId: data.taskId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        duration,
        description: data.description,
      },
    });
  }

  /**
   * Update a manual time entry.
   */
  static async updateEntry(
    userId: string,
    workspaceId: string,
    entryId: string,
    data: { startTime?: Date; endTime?: Date; description?: string }
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
    if (!entry || entry.userId !== userId) throw new NotFoundError('Time entry not found');

    const newStart = data.startTime ? new Date(data.startTime) : entry.startTime;
    const newEnd = data.endTime ? new Date(data.endTime) : entry.endTime;
    const duration =
      newEnd ? Math.round((newEnd.getTime() - newStart.getTime()) / 60000) : undefined;

    return prisma.timeEntry.update({
      where: { id: entryId },
      data: { ...data, duration },
    });
  }

  /**
   * Delete a time entry.
   */
  static async deleteEntry(userId: string, workspaceId: string, entryId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
    if (!entry || entry.userId !== userId) throw new NotFoundError('Time entry not found');

    return prisma.timeEntry.delete({ where: { id: entryId } });
  }

  /**
   * Get time summary for a task.
   */
  static async getTaskTimeSummary(userId: string, workspaceId: string, taskId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const task = await prisma.task.findUnique({ where: { id: taskId, workspaceId } });
    if (!task) throw new NotFoundError('Task not found');

    const entries = await prisma.timeEntry.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { startTime: 'desc' },
    });

    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0);

    return {
      entries,
      totalMinutes,
      totalHours: parseFloat((totalMinutes / 60).toFixed(2)),
    };
  }

  /**
   * Get time summary for a project (aggregated by task and team member).
   */
  static async getProjectTimeSummary(userId: string, workspaceId: string, projectId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const project = await prisma.project.findUnique({ where: { id: projectId, workspaceId } });
    if (!project) throw new NotFoundError('Project not found');

    const entries = await prisma.timeEntry.findMany({
      where: { task: { projectId } },
      include: {
        user: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0);

    // Group by user
    const byUser: Record<string, { userId: string; name: string; totalMinutes: number }> = {};
    for (const entry of entries) {
      const key = entry.user.id;
      if (!byUser[key]) byUser[key] = { userId: key, name: entry.user.name ?? '', totalMinutes: 0 };
      byUser[key].totalMinutes += entry.duration ?? 0;
    }

    return {
      totalMinutes,
      totalHours: parseFloat((totalMinutes / 60).toFixed(2)),
      byUser: Object.values(byUser),
      entries,
    };
  }

  /**
   * Get time summary for a team member or the whole team.
   */
  static async getTeamTimeSummary(
    userId: string,
    workspaceId: string,
    teamId: string,
    options?: { from?: Date; to?: Date }
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const team = await prisma.team.findUnique({
      where: { id: teamId, workspaceId },
      include: { members: { select: { userId: true } } },
    });
    if (!team) throw new NotFoundError('Team not found');

    const memberIds = team.members.map((m) => m.userId);

    const dateFilter: any = {};
    if (options?.from) dateFilter.gte = new Date(options.from);
    if (options?.to) dateFilter.lte = new Date(options.to);

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: { in: memberIds },
        ...(Object.keys(dateFilter).length ? { startTime: dateFilter } : {}),
      },
      include: {
        user: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0);

    const byUser: Record<string, { userId: string; name: string; totalMinutes: number }> = {};
    for (const entry of entries) {
      const key = entry.user.id;
      if (!byUser[key]) byUser[key] = { userId: key, name: entry.user.name ?? '', totalMinutes: 0 };
      byUser[key].totalMinutes += entry.duration ?? 0;
    }

    return {
      teamId,
      totalMinutes,
      totalHours: parseFloat((totalMinutes / 60).toFixed(2)),
      byUser: Object.values(byUser),
    };
  }

  /**
   * Get active timer for a user.
   */
  static async getActiveTimer(userId: string, workspaceId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    return prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
      include: { task: { select: { id: true, title: true } } },
    });
  }
}
