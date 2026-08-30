import { prisma } from '@/lib/db';
import { WorkspaceService } from './workspace.service';
import { NotificationService } from './notification.service';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

// Extracts @userId mentions from comment content
const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;

function extractMentions(content: string): string[] {
  const ids: string[] = [];
  let match;
  while ((match = MENTION_REGEX.exec(content)) !== null) {
    ids.push(match[2]); // userId captured from @[Name](userId)
  }
  return ids;
}

export class CommentService {
  /**
   * Create a comment on a task.
   * Automatically fires notifications for: @mentions, and thread replies.
   */
  static async createComment(
    userId: string,
    workspaceId: string,
    taskId: string,
    content: string,
    parentId?: string
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const task = await prisma.task.findUnique({ where: { id: taskId, workspaceId } });
    if (!task) throw new NotFoundError('Task not found');

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.taskId !== taskId)
        throw new NotFoundError('Parent comment not found');
    }

    const author = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: { taskId, userId, content, parentId: parentId || null },
      });

      // Save @mention records
      const mentionedIds = extractMentions(content).filter((id) => id !== userId);
      if (mentionedIds.length > 0) {
        await tx.commentMention.createMany({
          data: mentionedIds.map((mId) => ({ commentId: newComment.id, userId: mId })),
          skipDuplicates: true,
        });
      }

      return newComment;
    });

    // Fire notifications outside the transaction (non-critical path)
    const mentionedIds = extractMentions(content).filter((id) => id !== userId);
    if (mentionedIds.length > 0) {
      await NotificationService.notifyCommentMentions({
        mentionedUserIds: mentionedIds,
        authorName: author?.name || 'Someone',
        taskId,
        taskTitle: task.title,
        workspaceId,
        commentId: comment.id,
      });
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
      if (parentComment && parentComment.userId !== userId) {
        await NotificationService.notifyCommentReply({
          parentAuthorId: parentComment.userId,
          replierName: author?.name || 'Someone',
          taskId,
          taskTitle: task.title,
          workspaceId,
          commentId: comment.id,
        });
      }
    }

    return comment;
  }

  /**
   * Get all comments for a task (threaded)
   */
  static async getTaskComments(userId: string, workspaceId: string, taskId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const task = await prisma.task.findUnique({ where: { id: taskId, workspaceId } });
    if (!task) throw new NotFoundError('Task not found');

    // Fetch top-level comments with their replies nested
    return prisma.comment.findMany({
      where: { taskId, parentId: null },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Edit own comment
   */
  static async updateComment(
    userId: string,
    workspaceId: string,
    commentId: string,
    content: string
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundError('Comment not found');

    if (comment.userId !== userId)
      throw new ForbiddenError('You can only edit your own comments');

    return prisma.comment.update({
      where: { id: commentId },
      data: { content },
    });
  }

  /**
   * Delete own comment (Admins and Owners can delete any)
   */
  static async deleteComment(userId: string, workspaceId: string, commentId: string) {
    const member = await WorkspaceService.verifyAccess(userId, workspaceId);

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundError('Comment not found');

    const isAdminOrOwner = ['OWNER', 'ADMIN'].includes(member.role);
    if (comment.userId !== userId && !isAdminOrOwner)
      throw new ForbiddenError('You do not have permission to delete this comment');

    return prisma.comment.delete({ where: { id: commentId } });
  }
}
