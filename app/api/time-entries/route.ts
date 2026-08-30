import { NextResponse } from 'next/server';
import { TimeTrackingService } from '@/lib/services/time-tracking.service';
import { handleApiError } from '@/lib/api-handler';
import { z } from 'zod';

const startTimerSchema = z.object({
  taskId: z.string(),
  description: z.string().optional(),
});

const manualEntrySchema = z.object({
  taskId: z.string(),
  startTime: z.string().transform(val => new Date(val)),
  endTime: z.string().transform(val => new Date(val)),
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

    const taskId = searchParams.get('taskId');
    const projectId = searchParams.get('projectId');
    const teamId = searchParams.get('teamId');

    if (taskId) {
      const summary = await TimeTrackingService.getTaskTimeSummary(userId, workspaceId, taskId);
      return NextResponse.json({ success: true, data: summary });
    }

    if (projectId) {
      const summary = await TimeTrackingService.getProjectTimeSummary(userId, workspaceId, projectId);
      return NextResponse.json({ success: true, data: summary });
    }

    if (teamId) {
      const summary = await TimeTrackingService.getTeamTimeSummary(userId, workspaceId, teamId);
      return NextResponse.json({ success: true, data: summary });
    }

    const activeTimer = await TimeTrackingService.getActiveTimer(userId, workspaceId);
    return NextResponse.json({ success: true, data: activeTimer });
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

    if (body.type === 'manual') {
      const data = manualEntrySchema.parse(body);
      const entry = await TimeTrackingService.createManualEntry(userId, workspaceId, data);
      return NextResponse.json({ success: true, data: entry });
    } else {
      const data = startTimerSchema.parse(body);
      const entry = await TimeTrackingService.startTimer(userId, workspaceId, data.taskId, data.description);
      return NextResponse.json({ success: true, data: entry });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
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

    const stopped = await TimeTrackingService.stopTimer(userId, workspaceId);
    return NextResponse.json({ success: true, data: stopped });
  } catch (error) {
    return handleApiError(error);
  }
}
