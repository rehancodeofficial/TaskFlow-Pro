import { NextResponse } from 'next/server';
import { SprintService } from '@/lib/services/sprint.service';
import { handleApiError } from '@/lib/api-handler';
import { z } from 'zod';

const createSprintSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  goal: z.string().optional(),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)),
});

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
    const data = createSprintSchema.parse(body);

    const sprint = await SprintService.createSprint(userId, workspaceId, data.projectId, {
      name: data.name,
      goal: data.goal,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    return NextResponse.json({ success: true, data: sprint });
  } catch (error) {
    return handleApiError(error);
  }
}
