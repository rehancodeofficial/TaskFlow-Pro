import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import { prisma } from '../lib/db';
import { WorkspaceService } from '../lib/services/workspace.service';
import { ProjectService } from '../lib/services/project.service';
import { hashPassword } from '../lib/auth';

describe('Project Service Tests', () => {
  let owner: any;
  let viewer: any;
  let workspaceA: any;
  let workspaceB: any;
  let projectA: any;

  beforeAll(async () => {
    const pwd = await hashPassword('password123');
    owner = await prisma.user.create({ data: { email: 'owner@projects.com', password: pwd, name: 'Owner' } });
    viewer = await prisma.user.create({ data: { email: 'viewer@projects.com', password: pwd, name: 'Viewer' } });

    workspaceA = await WorkspaceService.createWorkspace(owner.id, { name: 'WS A' });
    workspaceB = await WorkspaceService.createWorkspace(viewer.id, { name: 'WS B' });

    // Add viewer to Workspace A as VIEWER
    await prisma.workspaceMember.create({
      data: { workspaceId: workspaceA.id, userId: viewer.id, role: 'VIEWER' }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: '@projects.com' } } });
    await prisma.workspace.deleteMany({ where: { id: { in: [workspaceA.id, workspaceB.id] } } });
  });

  it('Owner can create a project in Workspace A (CRUD - Create)', async () => {
    projectA = await ProjectService.createProject(owner.id, workspaceA.id, { name: 'Project A' });
    expect(projectA.id).toBeDefined();
    expect(projectA.workspaceId).toBe(workspaceA.id);
  });

  it('Viewer CANNOT create a project (RBAC Permission)', async () => {
    await expect(
      ProjectService.createProject(viewer.id, workspaceA.id, { name: 'Project B' })
    ).rejects.toThrow('You do not have the required role to perform this action.');
  });

  it('Owner CANNOT create project in Workspace B (Tenant Isolation)', async () => {
    await expect(
      ProjectService.createProject(owner.id, workspaceB.id, { name: 'Project B' })
    ).rejects.toThrow('You do not have access to this workspace.');
  });

  it('Viewer can list projects in Workspace A (Pagination)', async () => {
    // Create a second project
    await ProjectService.createProject(owner.id, workspaceA.id, { name: 'Project 2' });
    
    const result = await ProjectService.listProjects(viewer.id, workspaceA.id, 1, 1);
    expect(result.data.length).toBe(1);
    expect(result.meta.total).toBeGreaterThanOrEqual(2);
    expect(result.meta.totalPages).toBeGreaterThanOrEqual(2);
  });

  it('Owner can update project (CRUD - Update)', async () => {
    const updated = await ProjectService.updateProject(owner.id, workspaceA.id, projectA.id, { status: 'ACTIVE' });
    expect(updated.status).toBe('ACTIVE');
  });

  it('Owner can delete project (CRUD - Delete)', async () => {
    await ProjectService.deleteProject(owner.id, workspaceA.id, projectA.id);
    const result = await prisma.project.findUnique({ where: { id: projectA.id } });
    expect(result).toBeNull();
  });
});
