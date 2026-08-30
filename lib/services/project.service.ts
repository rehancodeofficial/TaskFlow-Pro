import { prisma } from '@/lib/db';
import { WorkspaceService } from './workspace.service';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { ProjectStatus } from '@prisma/client';

export class ProjectService {
  /**
   * List paginated projects for a workspace
   */
  static async listProjects(userId: string, workspaceId: string, page = 1, limit = 20) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { workspaceId },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { tasks: true, sprints: true },
          },
        },
      }),
      prisma.project.count({ where: { workspaceId } }),
    ]);

    return {
      data: projects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single project
   */
  static async getProject(userId: string, workspaceId: string, projectId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const project = await prisma.project.findUnique({
      where: { id: projectId, workspaceId },
    });

    if (!project) throw new NotFoundError('Project not found');

    return project;
  }

  /**
   * Create a project
   */
  static async createProject(userId: string, workspaceId: string, data: { name: string; description?: string; color?: string }) {
    // Only OWNER, ADMIN, or PROJECT_MANAGER can create
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER']);

    return prisma.project.create({
      data: {
        ...data,
        workspaceId,
      },
    });
  }

  /**
   * Update a project
   */
  static async updateProject(userId: string, workspaceId: string, projectId: string, data: { name?: string; description?: string; status?: ProjectStatus }) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER']);

    const existing = await prisma.project.findUnique({
      where: { id: projectId, workspaceId },
    });
    if (!existing) throw new NotFoundError('Project not found');

    return prisma.project.update({
      where: { id: projectId },
      data,
    });
  }

  /**
   * Delete a project
   */
  static async deleteProject(userId: string, workspaceId: string, projectId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN']);

    const existing = await prisma.project.findUnique({
      where: { id: projectId, workspaceId },
    });
    if (!existing) throw new NotFoundError('Project not found');

    return prisma.project.delete({
      where: { id: projectId },
    });
  }
}
