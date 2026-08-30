import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/db';
import { WorkspaceService } from '../lib/services/workspace.service';
import { ProjectService } from '../lib/services/project.service';
import { TaskService } from '../lib/services/task.service';
import { TimeTrackingService } from '../lib/services/time-tracking.service';
import { GoalService } from '../lib/services/goal.service';
import { hashPassword } from '../lib/auth';

describe('Time Tracking Service', () => {
  let user: any;
  let workspace: any;
  let project: any;
  let task: any;

  beforeAll(async () => {
    const pwd = await hashPassword('password123');
    user = await prisma.user.create({
      data: { email: 'time@test.com', password: pwd, name: 'Time User' },
    });
    workspace = await WorkspaceService.createWorkspace(user.id, { name: 'Time WS' });
    project = await ProjectService.createProject(user.id, workspace.id, { name: 'Time Project' });
    task = await TaskService.createTask(user.id, workspace.id, project.id, { title: 'Timed Task' });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'time@test.com' } });
    await prisma.workspace.deleteMany({ where: { id: workspace.id } });
  });

  it('Can start a timer', async () => {
    const entry = await TimeTrackingService.startTimer(user.id, workspace.id, task.id);
    expect(entry.id).toBeDefined();
    expect(entry.endTime).toBeNull();
  });

  it('Cannot start a second timer while one is running (overlap prevention)', async () => {
    await expect(
      TimeTrackingService.startTimer(user.id, workspace.id, task.id)
    ).rejects.toThrow('You already have an active timer running');
  });

  it('Can get active timer', async () => {
    const active = await TimeTrackingService.getActiveTimer(user.id, workspace.id);
    expect(active).not.toBeNull();
    expect(active?.taskId).toBe(task.id);
  });

  it('Can stop the active timer and calculates duration', async () => {
    const stopped = await TimeTrackingService.stopTimer(user.id, workspace.id);
    expect(stopped.endTime).not.toBeNull();
    expect(stopped.duration).toBeGreaterThanOrEqual(0);
  });

  it('Can create a manual time entry', async () => {
    const start = new Date(Date.now() - 3600000); // 1 hour ago
    const end = new Date();
    const entry = await TimeTrackingService.createManualEntry(user.id, workspace.id, {
      taskId: task.id,
      startTime: start,
      endTime: end,
    });
    expect(entry.duration).toBeGreaterThan(50); // ~60 minutes
  });

  it('Manual entry validates start < end', async () => {
    const now = new Date();
    await expect(
      TimeTrackingService.createManualEntry(user.id, workspace.id, {
        taskId: task.id,
        startTime: now,
        endTime: new Date(now.getTime() - 1000),
      })
    ).rejects.toThrow('Start time must be before end time');
  });

  it('Can get task time summary', async () => {
    const summary = await TimeTrackingService.getTaskTimeSummary(user.id, workspace.id, task.id);
    expect(summary.entries.length).toBeGreaterThan(0);
    expect(summary.totalMinutes).toBeGreaterThan(0);
  });

  it('Can get project time summary with per-user breakdown', async () => {
    const summary = await TimeTrackingService.getProjectTimeSummary(user.id, workspace.id, project.id);
    expect(summary.totalMinutes).toBeGreaterThan(0);
    expect(summary.byUser.length).toBeGreaterThan(0);
  });
});

describe('Goal Service', () => {
  let owner: any;
  let viewer: any;
  let workspace: any;
  let project: any;
  let goal: any;

  beforeAll(async () => {
    const pwd = await hashPassword('password123');
    owner = await prisma.user.create({ data: { email: 'goal-owner@test.com', password: pwd, name: 'Goal Owner' } });
    viewer = await prisma.user.create({ data: { email: 'goal-viewer@test.com', password: pwd, name: 'Goal Viewer' } });
    workspace = await WorkspaceService.createWorkspace(owner.id, { name: 'Goal WS' });
    project = await ProjectService.createProject(owner.id, workspace.id, { name: 'Goal Project' });

    await prisma.workspaceMember.create({
      data: { workspaceId: workspace.id, userId: viewer.id, role: 'VIEWER' },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: ['goal-owner@test.com', 'goal-viewer@test.com'] } } });
    await prisma.workspace.deleteMany({ where: { id: workspace.id } });
  });

  it('Owner can create a goal', async () => {
    const target = new Date();
    target.setMonth(target.getMonth() + 3);
    goal = await GoalService.createGoal(owner.id, workspace.id, {
      name: 'Reach 1000 customers',
      projectId: project.id,
      targetDate: target,
    });
    expect(goal.id).toBeDefined();
    expect(goal.status).toBe('NOT_STARTED');
    expect(goal.progress).toBe(0);
  });

  it('Viewer CANNOT create a goal (RBAC)', async () => {
    await expect(
      GoalService.createGoal(viewer.id, workspace.id, { name: 'Blocked Goal' })
    ).rejects.toThrow('You do not have the required role');
  });

  it('Viewer can read goals (listing)', async () => {
    const goals = await GoalService.listGoals(viewer.id, workspace.id);
    expect(goals.length).toBeGreaterThan(0);
  });

  it('Can update progress from 0 → 50 and auto-derive ON_TRACK status', async () => {
    const updated = await GoalService.updateProgress(owner.id, workspace.id, goal.id, 50);
    expect(updated.progress).toBe(50);
    expect(updated.status).toBe('ON_TRACK');
  });

  it('Can update progress to 100 and auto-mark as COMPLETED', async () => {
    const updated = await GoalService.updateProgress(owner.id, workspace.id, goal.id, 100);
    expect(updated.progress).toBe(100);
    expect(updated.status).toBe('COMPLETED');
  });

  it('Rejects progress values outside 0–100', async () => {
    await expect(
      GoalService.updateProgress(owner.id, workspace.id, goal.id, 150)
    ).rejects.toThrow('Progress must be between 0 and 100');
  });

  it('Can manually override status to AT_RISK', async () => {
    const updated = await GoalService.setStatus(owner.id, workspace.id, goal.id, 'AT_RISK');
    expect(updated.status).toBe('AT_RISK');
  });

  it('Viewer CANNOT delete a goal (RBAC)', async () => {
    await expect(
      GoalService.deleteGoal(viewer.id, workspace.id, goal.id)
    ).rejects.toThrow();
  });

  it('Owner can delete a goal', async () => {
    await GoalService.deleteGoal(owner.id, workspace.id, goal.id);
    const found = await prisma.goal.findUnique({ where: { id: goal.id } });
    expect(found).toBeNull();
  });
});
