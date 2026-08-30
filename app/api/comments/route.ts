import { NextResponse } from 'next/server';
import { CommentService } from '@/lib/services/comment.service';
import { handleApiError } from '@/lib/api-handler';
import { z } from 'zod';

const createCommentSchema = z.object({
  taskId: z.string(),
  content: z.string().min(1),
  parentId: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const taskId = searchParams.get('taskId');
    if (!workspaceId || !taskId) {
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'workspaceId and taskId are required' } }, { status: 400 });
    }

    const comments = await CommentService.getTaskComments(userId, workspaceId, taskId);
    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'workspaceId is required' } }, { status: 400 });
    }

    const body = await req.json();
    const data = createCommentSchema.parse(body);

    const comment = await CommentService.createComment(userId, workspaceId, data.taskId, data.content, data.parentId);
    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    return handleApiError(error);
  }
}
