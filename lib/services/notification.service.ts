import { prisma } from '@/lib/db';

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_MENTIONED'
  | 'COMMENT_MENTIONED'
  | 'COMMENT_REPLY'
  | 'SPRINT_STARTED'
  | 'SPRINT_COMPLETED'
  | 'DEADLINE_APPROACHING'
  | 'WORKSPACE_INVITATION';

export interface CreateNotificationInput {
  userId: string;
  workspaceId: string;
  type: NotificationType;
  content: string;
  link?: string;
}

export class NotificationService {
  /**
   * Create a single notification
   */
  static async create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        type: input.type,
        content: input.content,
        link: input.link,
        read: false,
      },
    });
  }

  /**
   * Create notifications for multiple users (bulk)
   */
  static async createBulk(inputs: CreateNotificationInput[]) {
    if (inputs.length === 0) return [];
    return prisma.notification.createMany({
      data: inputs.map((i) => ({
        userId: i.userId,
        workspaceId: i.workspaceId,
        type: i.type,
        content: i.content,
        link: i.link,
        read: false,
      })),
    });
  }

  /**
   * Notify a user about a task assignment
   */
  static async notifyTaskAssigned({
    assigneeId,
    assignerName,
    taskId,
    taskTitle,
    workspaceId,
  }: {
    assigneeId: string;
    assignerName: string;
    taskId: string;
    taskTitle: string;
    workspaceId: string;
  }) {
    return NotificationService.create({
      userId: assigneeId,
      workspaceId,
      type: 'TASK_ASSIGNED',
      content: `${assignerName} assigned you to task: "${taskTitle}"`,
      link: `/app/tasks/${taskId}`,
    });
  }

  /**
   * Notify mentioned users inside a comment
   */
  static async notifyCommentMentions({
    mentionedUserIds,
    authorName,
    taskId,
    taskTitle,
    workspaceId,
    commentId,
  }: {
    mentionedUserIds: string[];
    authorName: string;
    taskId: string;
    taskTitle: string;
    workspaceId: string;
    commentId: string;
  }) {
    if (mentionedUserIds.length === 0) return;

    return NotificationService.createBulk(
      mentionedUserIds.map((uid) => ({
        userId: uid,
        workspaceId,
        type: 'COMMENT_MENTIONED' as NotificationType,
        content: `${authorName} mentioned you in a comment on "${taskTitle}"`,
        link: `/app/tasks/${taskId}#comment-${commentId}`,
      }))
    );
  }

  /**
   * Notify the parent comment author about a reply
   */
  static async notifyCommentReply({
    parentAuthorId,
    replierName,
    taskId,
    taskTitle,
    workspaceId,
    commentId,
  }: {
    parentAuthorId: string;
    replierName: string;
    taskId: string;
    taskTitle: string;
    workspaceId: string;
    commentId: string;
  }) {
    return NotificationService.create({
      userId: parentAuthorId,
      workspaceId,
      type: 'COMMENT_REPLY',
      content: `${replierName} replied to your comment on "${taskTitle}"`,
      link: `/app/tasks/${taskId}#comment-${commentId}`,
    });
  }

  /**
   * Notify workspace members about sprint events
   */
  static async notifySprintEvent({
    memberIds,
    workspaceId,
    type,
    sprintName,
    projectId,
  }: {
    memberIds: string[];
    workspaceId: string;
    type: 'SPRINT_STARTED' | 'SPRINT_COMPLETED';
    sprintName: string;
    projectId: string;
  }) {
    const content =
      type === 'SPRINT_STARTED'
        ? `Sprint "${sprintName}" has started`
        : `Sprint "${sprintName}" has been completed`;

    return NotificationService.createBulk(
      memberIds.map((uid) => ({
        userId: uid,
        workspaceId,
        type,
        content,
        link: `/app/projects/${projectId}/sprints`,
      }))
    );
  }

  /**
   * Get paginated notifications for a user in a workspace
   */
  static async getUserNotifications(userId: string, workspaceId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, workspaceId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId, workspaceId } }),
      prisma.notification.count({ where: { userId, workspaceId, read: false } }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark specific notifications as read
   */
  static async markAsRead(userId: string, notificationIds: string[]) {
    return prisma.notification.updateMany({
      where: { id: { in: notificationIds }, userId },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read for a user in a workspace
   */
  static async markAllAsRead(userId: string, workspaceId: string) {
    return prisma.notification.updateMany({
      where: { userId, workspaceId, read: false },
      data: { read: true },
    });
  }
}
