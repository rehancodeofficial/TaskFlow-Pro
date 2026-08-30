import { NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/analytics.service';
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

    const projectId = searchParams.get('projectId');

    if (projectId) {
      const data = await AnalyticsService.getProjectAnalytics(userId, workspaceId, projectId);
      return NextResponse.json({ success: true, data });
    } else {
      const data = await AnalyticsService.getWorkspaceAnalytics(userId, workspaceId);
      return NextResponse.json({ success: true, data });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
