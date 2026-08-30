import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import { prisma } from '../lib/db';
import { WorkspaceService } from '../lib/services/workspace.service';
import { hashPassword } from '../lib/auth';

describe('Tenant Isolation Tests', () => {
  let userA: any;
  let userB: any;
  let workspaceA: any;
  let workspaceB: any;

  beforeAll(async () => {
    // Setup users
    const pwd = await hashPassword('password123');
    userA = await prisma.user.create({
      data: { email: 'userA@test.com', password: pwd, name: 'User A' }
    });
    userB = await prisma.user.create({
      data: { email: 'userB@test.com', password: pwd, name: 'User B' }
    });

    // Setup Workspaces
    workspaceA = await WorkspaceService.createWorkspace(userA.id, { name: 'Workspace A' });
    workspaceB = await WorkspaceService.createWorkspace(userB.id, { name: 'Workspace B' });

    // Ensure User A is not in Workspace B
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: { in: ['userA@test.com', 'userB@test.com'] } }
    });
    await prisma.workspace.deleteMany({
      where: { id: { in: [workspaceA.id, workspaceB.id] } }
    });
  });

  it('User A can access Workspace A', async () => {
    const member = await WorkspaceService.verifyAccess(userA.id, workspaceA.id);
    expect(member.role).toBe('OWNER');
  });

  it('User A CANNOT access Workspace B', async () => {
    await expect(
      WorkspaceService.verifyAccess(userA.id, workspaceB.id)
    ).rejects.toThrow('You do not have access to this workspace.');
  });

  it('User B CANNOT access Workspace A', async () => {
    await expect(
      WorkspaceService.verifyAccess(userB.id, workspaceA.id)
    ).rejects.toThrow('You do not have access to this workspace.');
  });
});
