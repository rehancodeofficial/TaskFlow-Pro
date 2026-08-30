import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/db';
import { WorkspaceService } from '../lib/services/workspace.service';
import { ProjectService } from '../lib/services/project.service';
import { TaskService } from '../lib/services/task.service';
import { SprintService } from '../lib/services/sprint.service';
import { hashPassword } from '../lib/auth';

describe('Sprint Management & Analytics Tests', () => {
  let owner: any;
  let workspace: any;
  let project: any;
  let sprint: any;
  let task1: any;
  let task2: any;

  beforeAll(async () => {
    const pwd = await hashPassword('password123');
    owner = await prisma.user.create({ data: { email: 'sprints@test.com', password: pwd, name: 'Sprints Owner' } });
    workspace = await WorkspaceService.createWorkspace(owner.id, { name: 'Sprint WS' });
    project = await ProjectService.createProject(owner.id, workspace.id, { name: 'Sprint Project' });

    task1 = await TaskService.createTask(owner.id, workspace.id, project.id, { title: 'T1', storyPoints: 5 });
    task2 = await TaskService.createTask(owner.id, workspace.id, project.id, { title: 'T2', storyPoints: 8 });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'sprints@test.com' } });
    await prisma.workspace.deleteMany({ where: { id: workspace.id } });
  });

  it('Can create a sprint in PLANNED state', async () => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 14); // 2 weeks

    sprint = await SprintService.createSprint(owner.id, workspace.id, project.id, {
      name: 'Sprint 1',
      startDate: start,
      endDate: end
    });

    expect(sprint.id).toBeDefined();
    expect(sprint.status).toBe('PLANNED');
  });

  it('Cannot complete a PLANNED sprint', async () => {
    await expect(
      SprintService.completeSprint(owner.id, workspace.id, sprint.id)
    ).rejects.toThrow('Cannot complete a sprint that is not ACTIVE');
  });

  it('Can add tasks to the sprint', async () => {
    const res = await SprintService.addTasksToSprint(owner.id, workspace.id, sprint.id, [task1.id, task2.id]);
    expect(res.success).toBe(true);
    expect(res.count).toBe(2);
  });

  it('Can start the sprint', async () => {
    const active = await SprintService.startSprint(owner.id, workspace.id, sprint.id);
    expect(active.status).toBe('ACTIVE');
  });

  it('Cannot start a second active sprint', async () => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 14);

    const sprint2 = await SprintService.createSprint(owner.id, workspace.id, project.id, {
      name: 'Sprint 2',
      startDate: start,
      endDate: end
    });

    await expect(
      SprintService.startSprint(owner.id, workspace.id, sprint2.id)
    ).rejects.toThrow('An active sprint already exists for this project');
  });

  it('Calculates Sprint Analytics accurately', async () => {
    // Complete task 1
    await TaskService.updateTask(owner.id, workspace.id, task1.id, { status: 'DONE' });
    // update completedAt (mocking since updateTask doesn't auto-set it yet, but prisma doesn't allow direct update if not exposed, we do it via raw or update)
    await prisma.task.update({ where: { id: task1.id }, data: { completedAt: new Date() } });

    const analytics = await SprintService.getSprintAnalytics(owner.id, workspace.id, sprint.id);
    
    expect(analytics.totalPoints).toBe(13); // 5 + 8
    expect(analytics.completedPoints).toBe(5);
    expect(analytics.remainingPoints).toBe(8);
    expect(analytics.burndown.length).toBeGreaterThan(0);
  });

  it('Completes the sprint and rolls uncompleted tasks to backlog', async () => {
    await SprintService.completeSprint(owner.id, workspace.id, sprint.id);
    
    const closedSprint = await prisma.sprint.findUnique({ where: { id: sprint.id } });
    expect(closedSprint?.status).toBe('COMPLETED');

    const uncompletedTask = await prisma.task.findUnique({ where: { id: task2.id } });
    expect(uncompletedTask?.sprintId).toBeNull(); // Rolled out of the sprint
    
    const completedTask = await prisma.task.findUnique({ where: { id: task1.id } });
    expect(completedTask?.sprintId).toBe(sprint.id); // Stays in the sprint
  });
});
