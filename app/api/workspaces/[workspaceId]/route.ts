import { NextResponse } from 'next/server';
import { WorkspaceService } from '@/lib/services/workspace.service';
import { handleApiError } from '@/lib/api-handler';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { workspaceId } = await params;
    const member = await WorkspaceService.verifyAccess(userId, workspaceId);

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: {
          select: { projects: true, members: true, teams: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: { ...workspace, userRole: member.role } });
  } catch (error) {
    return handleApiError(error);
  }
}
