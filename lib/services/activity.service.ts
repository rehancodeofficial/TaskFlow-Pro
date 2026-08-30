import { prisma } from '@/lib/db';
import { WorkspaceService } from './workspace.service';
import { NotFoundError } from '@/lib/errors';

export class ActivityService {
  /**
   * Log an activity / audit event
   */
  static async logActivity(
    workspaceId: string,
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>
  ) {
    return prisma.auditLog.create({
      data: {
        workspaceId,
        actorId,
        action,
        entityType,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  }

  /**
   * Get the activity feed for a workspace (paginated)
   */
  static async getActivityFeed(
    userId: string,
    workspaceId: string,
    filters?: { projectId?: string; actorId?: string; entityType?: string },
    page = 1,
    limit = 20
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const skip = (page - 1) * limit;

    const whereClause: any = { workspaceId };

    if (filters?.actorId) {
      whereClause.actorId = filters.actorId;
    }
    if (filters?.entityType) {
      whereClause.entityType = filters.entityType;
    }
    if (filters?.projectId) {
      // For projects, we want to capture logs directly tied to the project, or tasks belonging to the project.
      // Since tasks belong to projects, we can filter by entityType 'Project' and entityId, or tasks that belong to this project.
      // A simple implementation filters by entityType: 'Project' or entityId of the project.
      whereClause.OR = [
        { entityType: 'Project', entityId: filters.projectId },
        {
          entityType: 'Task',
          metadata: {
            contains: `"projectId":"${filters.projectId}"`,
          },
        },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          actor: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    return {
      data: logs.map((log) => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
