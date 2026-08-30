import { NextResponse } from 'next/server';
import { TeamService } from '@/lib/services/team.service';
import { handleApiError } from '@/lib/api-handler';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

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

    const teams = await TeamService.listTeams(userId, workspaceId);
    return NextResponse.json({ success: true, data: teams });
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
    const data = createTeamSchema.parse(body);

    const team = await TeamService.createTeam(userId, workspaceId, data);
    return NextResponse.json({ success: true, data: team });
  } catch (error) {
    return handleApiError(error);
  }
}
