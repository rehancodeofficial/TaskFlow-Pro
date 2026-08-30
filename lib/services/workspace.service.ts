import { prisma } from '@/lib/db';
import { AppError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { Role } from '@prisma/client';

export class WorkspaceService {
  /**
   * Creates a new workspace and assigns the creator as the OWNER
   */
  static async createWorkspace(userId: string, data: { name: string; description?: string }) {
    // Slug generation based on name
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    
    return prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: 'OWNER',
        },
      });

      return workspace;
    });
  }

  /**
   * Verifies if a user has access to a workspace
   */
  static async verifyAccess(userId: string, workspaceId: string, requiredRoles?: Role[]) {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenError('You do not have access to this workspace.');
    }

    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(member.role)) {
      throw new ForbiddenError('You do not have the required role to perform this action.');
    }

    return member;
  }

  /**
   * Lists all workspaces a user belongs to
   */
  static async getUserWorkspaces(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { workspace: { name: 'asc' } }
    });

    return memberships.map(m => ({
      ...m.workspace,
      userRole: m.role
    }));
  }
}
