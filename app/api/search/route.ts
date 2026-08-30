import { NextResponse } from 'next/server';
import { SearchService } from '@/lib/services/search.service';
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

    const query = searchParams.get('q') || '';
    if (!query) {
      return NextResponse.json({ success: true, data: [] });
    }

    const results = await SearchService.search(userId, workspaceId, query);
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return handleApiError(error);
  }
}
