import { NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification.service';
import { handleApiError } from '@/lib/api-handler';
import { z } from 'zod';

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

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await NotificationService.getUserNotifications(userId, workspaceId, page, limit);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
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

    if (body.all) {
      await NotificationService.markAllAsRead(userId, workspaceId);
    } else if (body.ids) {
      await NotificationService.markAsRead(userId, body.ids);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
