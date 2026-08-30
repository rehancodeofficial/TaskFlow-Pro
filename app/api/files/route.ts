import { NextResponse } from 'next/server';
import { FileService } from '@/lib/services/file.service';
import { handleApiError } from '@/lib/api-handler';
import { z } from 'zod';

const registerFileSchema = z.object({
  name: z.string().min(1),
  size: z.number().int().min(1),
  mimeType: z.string().min(1),
  url: z.string().url(),
  taskId: z.string().optional(),
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

    const taskId = searchParams.get('taskId') || undefined;

    const files = await FileService.listFiles(userId, workspaceId, taskId);
    return NextResponse.json({ success: true, data: files });
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
    const data = registerFileSchema.parse(body);

    const file = await FileService.registerFile(userId, workspaceId, data);
    return NextResponse.json({ success: true, data: file });
  } catch (error) {
    return handleApiError(error);
  }
}
