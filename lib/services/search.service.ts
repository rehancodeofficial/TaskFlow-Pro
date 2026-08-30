import { prisma } from '@/lib/db';
import { WorkspaceService } from './workspace.service';

export class SearchService {
  /**
   * Search globally across Projects, Tasks, Teams, and Goals inside a workspace.
   */
  static async search(userId: string, workspaceId: string, query: string) {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const lowercaseQuery = query.toLowerCase();

    const [projects, tasks, teams, goals] = await Promise.all([
      // Search Projects
      prisma.project.findMany({
        where: {
          workspaceId,
          OR: [
            { name: { contains: lowercaseQuery, mode: 'insensitive' } },
            { description: { contains: lowercaseQuery, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: { id: true, name: true, status: true },
      }),

      // Search Tasks
      prisma.task.findMany({
        where: {
          workspaceId,
          OR: [
            { title: { contains: lowercaseQuery, mode: 'insensitive' } },
            { description: { contains: lowercaseQuery, mode: 'insensitive' } },
          ],
        },
        take: 20,
        select: { id: true, title: true, status: true, priority: true, projectId: true },
      }),

      // Search Teams
      prisma.team.findMany({
        where: {
          workspaceId,
          name: { contains: lowercaseQuery, mode: 'insensitive' },
        },
        take: 10,
        select: { id: true, name: true },
      }),

      // Search Goals
      prisma.goal.findMany({
        where: {
          workspaceId,
          OR: [
            { name: { contains: lowercaseQuery, mode: 'insensitive' } },
            { description: { contains: lowercaseQuery, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: { id: true, name: true, status: true, progress: true },
      }),
    ]);

    // Format output
    const results = [
      ...projects.map((p) => ({
        type: 'Project',
        id: p.id,
        title: p.name,
        subtitle: `Status: ${p.status}`,
        link: `/app/projects/${p.id}`,
      })),
      ...tasks.map((t) => ({
        type: 'Task',
        id: t.id,
        title: t.title,
        subtitle: `Status: ${t.status} | Priority: ${t.priority}`,
        link: `/app/projects/${t.projectId}?task=${t.id}`,
      })),
      ...teams.map((t) => ({
        type: 'Team',
        id: t.id,
        title: t.name,
        subtitle: 'Workspace Team',
        link: `/app/settings/teams#${t.id}`,
      })),
      ...goals.map((g) => ({
        type: 'Goal',
        id: g.id,
        title: g.name,
        subtitle: `Progress: ${g.progress}% | Status: ${g.status}`,
        link: `/app/goals#${g.id}`,
      })),
    ];

    return results;
  }
}
