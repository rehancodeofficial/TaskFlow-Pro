import { NextResponse } from 'next/server';
import { AiTaskService } from '@/lib/services/ai.service';
import { handleApiError } from '@/lib/api-handler';
import { z } from 'zod';

const generatePreviewSchema = z.object({
  projectDescription: z.string().min(1),
  featureDescription: z.string().min(1),
  goal: z.string().min(1),
  requirements: z.string().min(1),
});

const saveAcceptedSchema = z.object({
  projectId: z.string(),
  tasks: z.array(z.any()),
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

    if (body.action === 'save') {
      const data = saveAcceptedSchema.parse(body);
      const result = await AiTaskService.saveAcceptedTasks(userId, workspaceId, data.projectId, data.tasks);
      return NextResponse.json({ success: true, data: { count: result.count, tasks: result.tasks } });
    } else {
      const data = generatePreviewSchema.parse(body);
      const preview = await AiTaskService.previewTasks(userId, workspaceId, data);
      return NextResponse.json({ success: true, data: preview });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
