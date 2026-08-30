import { prisma } from '@/lib/db';
import { WorkspaceService } from './workspace.service';
import { NotificationService } from './notification.service';
import { AppError, ForbiddenError, NotFoundError } from '@/lib/errors';

export class TeamService {
  /**
   * Create a new team in a workspace
   */
  static async createTeam(
    userId: string,
    workspaceId: string,
    data: { name: string; description?: string }
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER']);

    return prisma.team.create({
      data: { ...data, workspaceId },
    });
  }

  /**
   * List all teams in a workspace
   */
  static async listTeams(userId: string, workspaceId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    return prisma.team.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { members: true } },
        members: {
          where: { isLead: true },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get team details with all members
   */
  static async getTeam(userId: string, workspaceId: string, teamId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const team = await prisma.team.findUnique({
      where: { id: teamId, workspaceId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!team) throw new NotFoundError('Team not found');
    return team;
  }

  /**
   * Update team name / description
   */
  static async updateTeam(
    userId: string,
    workspaceId: string,
    teamId: string,
    data: { name?: string; description?: string }
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER']);

    const team = await prisma.team.findUnique({ where: { id: teamId, workspaceId } });
    if (!team) throw new NotFoundError('Team not found');

    return prisma.team.update({ where: { id: teamId }, data });
  }

  /**
   * Delete a team
   */
  static async deleteTeam(userId: string, workspaceId: string, teamId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN']);

    const team = await prisma.team.findUnique({ where: { id: teamId, workspaceId } });
    if (!team) throw new NotFoundError('Team not found');

    return prisma.team.delete({ where: { id: teamId } });
  }

  /**
   * Add a member to a team
   */
  static async addMember(
    userId: string,
    workspaceId: string,
    teamId: string,
    memberId: string,
    isLead = false
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER']);

    const team = await prisma.team.findUnique({ where: { id: teamId, workspaceId } });
    if (!team) throw new NotFoundError('Team not found');

    // Ensure the member belongs to the workspace
    await WorkspaceService.verifyAccess(memberId, workspaceId);

    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: memberId } },
    });
    if (existing) throw new AppError('User is already a member of this team', 'DUPLICATE', 400);

    return prisma.teamMember.create({
      data: { teamId, userId: memberId, isLead },
    });
  }

  /**
   * Remove a member from a team
   */
  static async removeMember(userId: string, workspaceId: string, teamId: string, memberId: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER']);

    const team = await prisma.team.findUnique({ where: { id: teamId, workspaceId } });
    if (!team) throw new NotFoundError('Team not found');

    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: memberId } },
    });
    if (!member) throw new NotFoundError('Member not found in this team');

    return prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId: memberId } },
    });
  }

  /**
   * Promote a member to team lead (or demote)
   */
  static async setLeadStatus(
    userId: string,
    workspaceId: string,
    teamId: string,
    memberId: string,
    isLead: boolean
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER']);

    const team = await prisma.team.findUnique({ where: { id: teamId, workspaceId } });
    if (!team) throw new NotFoundError('Team not found');

    return prisma.teamMember.update({
      where: { teamId_userId: { teamId, userId: memberId } },
      data: { isLead },
    });
  }
}
