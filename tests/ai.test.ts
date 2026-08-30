import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/db';
import { WorkspaceService } from '../lib/services/workspace.service';
import { ProjectService } from '../lib/services/project.service';
import { AiTaskService } from '../lib/services/ai.service';
import { hashPassword } from '../lib/auth';

describe('AI Task Generation Services Tests', () => {
  let user: any;
  let workspace: any;
  let project: any;

  beforeAll(async () => {
    const pwd = await hashPassword('password123');
    user = await prisma.user.create({
      data: { email: 'ai-tester@test.com', password: pwd, name: 'AI Tester' },
    });
    workspace = await WorkspaceService.createWorkspace(user.id, { name: 'AI WS' });
    project = await ProjectService.createProject(user.id, workspace.id, { name: 'AI Project' });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'ai-tester@test.com' } });
    await prisma.workspace.deleteMany({ where: { id: workspace.id } });
  });

  it('Can request AI preview of tasks', async () => {
    const preview = await AiTaskService.previewTasks(user.id, workspace.id, {
      projectDescription: 'TaskFlow Pro Project Management',
      featureDescription: 'Payment Checkout integration',
      goal: 'Allow workspace upgrades',
      requirements: 'Support Stripe, billing plans page, and webhook order creation.',
    });

    expect(preview.epic).toBeDefined();
    expect(preview.tasks.length).toBeGreaterThan(0);
    expect(preview.tasks[0].title).toBeDefined();
    expect(preview.tasks[0].storyPoints).toBeDefined();
  });

  it('Can save accepted AI tasks to project', async () => {
    const aiTasks = [
      {
        title: 'Integrate Stripe Webhooks',
        description: 'Create API endpoint for listening to payment events.',
        priority: 'URGENT' as any,
        storyPoints: 5,
        labels: ['Backend', 'Payment'],
        suggestedDependencies: [],
      },
      {
        title: 'Design Upgrade UI Banner',
        description: 'Polished B2B upgrade card with call-to-action.',
        priority: 'MEDIUM' as any,
        storyPoints: 2,
        labels: ['Frontend'],
        suggestedDependencies: [],
      },
    ];

    const result = await AiTaskService.saveAcceptedTasks(user.id, workspace.id, project.id, aiTasks);
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);

    const savedTasks = await prisma.task.findMany({
      where: { projectId: project.id },
      include: { labels: { include: { label: true } } },
    });

    expect(savedTasks.length).toBe(2);
    expect(savedTasks.some((t) => t.title === 'Integrate Stripe Webhooks')).toBe(true);
    expect(savedTasks.some((t) => t.title === 'Design Upgrade UI Banner')).toBe(true);

    // Verify label created
    const labels = await prisma.label.findMany({ where: { workspaceId: workspace.id } });
    expect(labels.some((l) => l.name === 'Payment')).toBe(true);
  });
});
