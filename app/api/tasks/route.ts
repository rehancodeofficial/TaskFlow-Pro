import { NextResponse } from 'next/server';
import { TaskService } from '@/lib/services/task.service';
import { handleApiError } from '@/lib/api-handler';
import { z } from 'zod';
import { Priority, TaskStatus } from '@prisma/client';

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  storyPoints: z.number().int().optional(),
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
    const projectId = searchParams.get('projectId');
    if (!workspaceId || !projectId) {
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'workspaceId and projectId are required' } }, { status: 400 });
    }

    const status = searchParams.get('status') as TaskStatus || undefined;
    const priority = searchParams.get('priority') as Priority || undefined;
    const assigneeId = searchParams.get('assigneeId') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await TaskService.listTasks(userId, workspaceId, projectId, {
      status,
      priority,
      assigneeId,
      search,
      page,
      limit,
    });
    return NextResponse.json({ success: true, ...result });
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
    const projectId = searchParams.get('projectId');
    if (!workspaceId || !projectId) {
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'workspaceId and projectId are required' } }, { status: 400 });
    }

    const body = await req.json();
    const data = createTaskSchema.parse(body);

    const task = await TaskService.createTask(userId, workspaceId, projectId, data);
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return handleApiError(error);
  }
}
