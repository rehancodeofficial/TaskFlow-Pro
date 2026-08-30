import { NextResponse } from 'next/server';
import { GoalService } from '@/lib/services/goal.service';
import { handleApiError } from '@/lib/api-handler';
import { z } from 'zod';

const createGoalSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  projectId: z.string().optional(),
  ownerId: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  targetDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  metrics: z.string().optional(),
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

    const projectId = searchParams.get('projectId') || undefined;

    const goals = await GoalService.listGoals(userId, workspaceId, projectId);
    return NextResponse.json({ success: true, data: goals });
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
    const data = createGoalSchema.parse(body);

    const goal = await GoalService.createGoal(userId, workspaceId, data);
    return NextResponse.json({ success: true, data: goal });
  } catch (error) {
    return handleApiError(error);
  }
}
