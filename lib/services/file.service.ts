import { prisma } from '@/lib/db';
import { WorkspaceService } from './workspace.service';
import { AppError, ForbiddenError, NotFoundError } from '@/lib/errors';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'text/plain',
  'text/csv',
];

export class FileService {
  /**
   * Register a new file upload in the workspace.
   * Handles metadata storage and validates size and MIME types.
   */
  static async registerFile(
    userId: string,
    workspaceId: string,
    data: {
      name: string;
      size: number;
      mimeType: string;
      url: string; // S3-compatible pre-signed or direct URL
      taskId?: string;
    }
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    // Validation
    if (data.size > MAX_FILE_SIZE) {
      throw new AppError('File size exceeds the 10MB limit', 'FILE_TOO_LARGE', 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(data.mimeType)) {
      throw new AppError('File format/MIME type is not allowed', 'INVALID_FILE_TYPE', 400);
    }

    // Verify task if attached
    if (data.taskId) {
      const task = await prisma.task.findUnique({
        where: { id: data.taskId, workspaceId },
      });
      if (!task) throw new NotFoundError('Task not found');
    }

    return prisma.file.create({
      data: {
        workspaceId,
        uploaderId: userId,
        name: data.name,
        size: data.size,
        mimeType: data.mimeType,
        url: data.url,
        taskId: data.taskId || null,
      },
    });
  }

  /**
   * Get metadata for a specific file. Checks workspace access before returning.
   */
  static async getFileMetadata(userId: string, workspaceId: string, fileId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const file = await prisma.file.findUnique({
      where: { id: fileId, workspaceId },
    });

    if (!file) throw new NotFoundError('File not found');

    return file;
  }

  /**
   * List all files in a workspace (optionally filtered by task).
   */
  static async listFiles(userId: string, workspaceId: string, taskId?: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    return prisma.file.findMany({
      where: {
        workspaceId,
        ...(taskId ? { taskId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete a file reference (Admins, Owners, or the uploader can delete).
   */
  static async deleteFile(userId: string, workspaceId: string, fileId: string) {
    const member = await WorkspaceService.verifyAccess(userId, workspaceId);

    const file = await prisma.file.findUnique({
      where: { id: fileId, workspaceId },
    });

    if (!file) throw new NotFoundError('File not found');

    const isUploader = file.uploaderId === userId;
    const isAdminOrOwner = ['OWNER', 'ADMIN'].includes(member.role);

    if (!isUploader && !isAdminOrOwner) {
      throw new ForbiddenError('You do not have permission to delete this file');
    }

    // In a real S3 setup, we would trigger an asynchronous object delete here
    return prisma.file.delete({
      where: { id: fileId },
    });
  }
}
