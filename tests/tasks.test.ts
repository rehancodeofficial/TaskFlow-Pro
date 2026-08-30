import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import { prisma } from '../lib/db';
import { WorkspaceService } from '../lib/services/workspace.service';
import { ProjectService } from '../lib/services/project.service';
import { TaskService } from '../lib/services/task.service';
import { hashPassword } from '../lib/auth';

describe('Task Service Tests', () => {
  let user: any;
  let otherUser: any;
  let workspace: any;
  let otherWorkspace: any;
  let project: any;
  let task1: any;
  let task2: any;

  beforeAll(async () => {
    const pwd = await hashPassword('password123');
    user = await prisma.user.create({ data: { email: 'user@tasks.com', password: pwd, name: 'User' } });
    otherUser = await prisma.user.create({ data: { email: 'other@tasks.com', password: pwd, name: 'Other' } });

    workspace = await WorkspaceService.createWorkspace(user.id, { name: 'Tasks WS' });
    otherWorkspace = await WorkspaceService.createWorkspace(otherUser.id, { name: 'Other WS' });

    // Add other user as member
    await prisma.workspaceMember.create({
      data: { workspaceId: workspace.id, userId: otherUser.id, role: 'MEMBER' }
    });

    project = await ProjectService.createProject(user.id, workspace.id, { name: 'Task Project' });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: '@tasks.com' } } });
    await prisma.workspace.deleteMany({ where: { id: { in: [workspace.id, otherWorkspace.id] } } });
  });

  it('Can create a task (CRUD - Create)', async () => {
    task1 = await TaskService.createTask(user.id, workspace.id, project.id, {
      title: 'Design API',
      description: 'API design phase',
      priority: 'HIGH'
    });
    expect(task1.id).toBeDefined();
    expect(task1.title).toBe('Design API');
    expect(task1.priority).toBe('HIGH');
  });

  it('Can create a subtask', async () => {
    task2 = await TaskService.createTask(user.id, workspace.id, project.id, {
      title: 'Design Auth API',
      parentId: task1.id
    });
    expect(task2.parentId).toBe(task1.id);
  });

  it('CANNOT access tasks across workspaces (Tenant Isolation)', async () => {
    await expect(
      TaskService.getTask(user.id, otherWorkspace.id, task1.id)
    ).rejects.toThrow('You do not have access to this workspace.');
  });

  it('Can update a task (CRUD - Update)', async () => {
    const updated = await TaskService.updateTask(user.id, workspace.id, task1.id, { status: 'IN_PROGRESS' });
    expect(updated.status).toBe('IN_PROGRESS');
  });

  it('Can assign a task (Assignment)', async () => {
    const assignment = await TaskService.assignTask(user.id, workspace.id, task1.id, otherUser.id);
    expect(assignment.userId).toBe(otherUser.id);
  });

  it('Can filter and search tasks (Filtering & Searching)', async () => {
    // Search by title
    let result = await TaskService.listTasks(user.id, workspace.id, project.id, { search: 'API' });
    expect(result.data.length).toBeGreaterThanOrEqual(1);

    // Filter by status
    result = await TaskService.listTasks(user.id, workspace.id, project.id, { status: 'IN_PROGRESS' });
    expect(result.data[0].id).toBe(task1.id);
  });
});
