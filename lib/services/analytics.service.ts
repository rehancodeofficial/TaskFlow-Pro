import { prisma } from '@/lib/db';
import { WorkspaceService } from './workspace.service';

export class AnalyticsService {
  /**
   * Get workspace level analytics
   */
  static async getWorkspaceAnalytics(userId: string, workspaceId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const now = new Date();

    const [
      totalTasks,
      completedTasks,
      overdueTasks,
      projectsCount,
      totalTimeEntries,
      goalsProgress,
    ] = await Promise.all([
      prisma.task.count({ where: { workspaceId } }),
      prisma.task.count({ where: { workspaceId, status: 'DONE' } }),
      prisma.task.count({
        where: {
          workspaceId,
          status: { notIn: ['DONE', 'CANCELLED'] },
          dueDate: { lt: now },
        },
      }),
      prisma.project.count({ where: { workspaceId } }),
      prisma.timeEntry.aggregate({
        where: { task: { workspaceId } },
        _sum: { duration: true },
      }),
      prisma.goal.aggregate({
        where: { workspaceId },
        _avg: { progress: true },
      }),
    ]);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalTimeHours = totalTimeEntries._sum.duration
      ? parseFloat((totalTimeEntries._sum.duration / 60).toFixed(1))
      : 0;

    // Get task status distribution
    const statusDistribution = await prisma.task.groupBy({
      by: ['status'],
      where: { workspaceId },
      _count: { id: true },
    });

    // Get task priority distribution
    const priorityDistribution = await prisma.task.groupBy({
      by: ['priority'],
      where: { workspaceId },
      _count: { id: true },
    });

    return {
      kpis: {
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        overdueTasks,
        projectsCount,
        totalTimeHours,
        averageGoalProgress: Math.round(goalsProgress._avg.progress || 0),
        completionRate,
      },
      statusDistribution: statusDistribution.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      priorityDistribution: priorityDistribution.map((item) => ({
        priority: item.priority,
        count: item._count.id,
      })),
    };
  }

  /**
   * Get project level analytics
   */
  static async getProjectAnalytics(userId: string, workspaceId: string, projectId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const now = new Date();

    const [
      totalTasks,
      completedTasks,
      overdueTasks,
      totalTimeEntries,
      storyPointsSum,
    ] = await Promise.all([
      prisma.task.count({ where: { projectId, workspaceId } }),
      prisma.task.count({ where: { projectId, workspaceId, status: 'DONE' } }),
      prisma.task.count({
        where: {
          projectId,
          workspaceId,
          status: { notIn: ['DONE', 'CANCELLED'] },
          dueDate: { lt: now },
        },
      }),
      prisma.timeEntry.aggregate({
        where: { task: { projectId, workspaceId } },
        _sum: { duration: true },
      }),
      prisma.task.aggregate({
        where: { projectId, workspaceId },
        _sum: { storyPoints: true },
      }),
    ]);

    const totalTimeHours = totalTimeEntries._sum.duration
      ? parseFloat((totalTimeEntries._sum.duration / 60).toFixed(1))
      : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      overdueTasks,
      totalTimeHours,
      totalStoryPoints: storyPointsSum._sum.storyPoints || 0,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }
}
