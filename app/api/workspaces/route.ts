import { NextResponse } from 'next/server';
import { WorkspaceService } from '@/lib/services/workspace.service';
import { handleApiError } from '@/lib/api-handler';
import { createWorkspaceSchema } from '@/lib/validations';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const workspaces = await WorkspaceService.getUserWorkspaces(userId);
    return NextResponse.json({ success: true, data: workspaces });
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

    const body = await req.json();
    const data = createWorkspaceSchema.parse(body);

    const workspace = await WorkspaceService.createWorkspace(userId, data);
    return NextResponse.json({ success: true, data: workspace });
  } catch (error) {
    return handleApiError(error);
  }
}
