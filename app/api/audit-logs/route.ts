import { NextResponse } from 'next/server';
import { ActivityService } from '@/lib/services/activity.service';
import { handleApiError } from '@/lib/api-handler';

export async function GET(req: Request) {
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

    const actorId = searchParams.get('actorId') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await ActivityService.getActivityFeed(
      userId,
      workspaceId,
      { actorId, entityType, projectId },
      page,
      limit
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
