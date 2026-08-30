import { z } from 'zod';
import { Priority, TaskStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { WorkspaceService } from './workspace.service';
import { TaskService } from './task.service';
import { AppError, NotFoundError } from '@/lib/errors';

// Define the strict Zod schema for validation
export const aiGeneratedTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  storyPoints: z.number().int().min(0).max(100).default(3),
  labels: z.array(z.string()).default([]),
  suggestedDependencies: z.array(z.string()).default([]), // suggested titles it depends on
});

export const aiGenerationResponseSchema = z.object({
  epic: z.string().min(1, 'Epic name is required'),
  tasks: z.array(aiGeneratedTaskSchema),
});

export type AIGeneratedTask = z.infer<typeof aiGeneratedTaskSchema>;
export type AIGenerationResponse = z.infer<typeof aiGenerationResponseSchema>;

export interface IAiProvider {
  generateEpicAndTasks(
    projectDescription: string,
    featureDescription: string,
    goal: string,
    requirements: string
  ): Promise<AIGenerationResponse>;
}

/**
 * Gemini Provider Implementation
 */
export class GeminiAiProvider implements IAiProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateEpicAndTasks(
    projectDescription: string,
    featureDescription: string,
    goal: string,
    requirements: string
  ): Promise<AIGenerationResponse> {
    const prompt = `
You are an expert product manager and software architect.
Generate a structured set of software development tasks based on the following input:

Project Description: ${projectDescription}
Feature/Epic Description: ${featureDescription}
Business Goal: ${goal}
Requirements: ${requirements}

Respond STRICTLY with a valid JSON object matching this schema:
{
  "epic": "A short, descriptive name for this epic/feature set",
  "tasks": [
    {
      "title": "Clear, actionable task title",
      "description": "Detailed description of acceptance criteria or technical implementation",
      "priority": "LOW", "MEDIUM", "HIGH", or "URGENT",
      "storyPoints": 1, 2, 3, 5, 8, 13 (Fibonacci integer),
      "labels": ["Frontend", "Backend", "Security", "DevOps" etc.],
      "suggestedDependencies": ["Title of task this depends on"]
    }
  ]
}
Do not add any markdown formatting, wrappers, or text outside the JSON object.
`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini');

      const parsed = JSON.parse(text);
      return aiGenerationResponseSchema.parse(parsed);
    } catch (error: any) {
      throw new AppError(`AI Generation failed: ${error.message}`, 'AI_GENERATION_FAILED', 502);
    }
  }
}

/**
 * Mock Provider Implementation (for testing and fallback without API Keys)
 */
export class MockAiProvider implements IAiProvider {
  async generateEpicAndTasks(
    projectDescription: string,
    featureDescription: string,
    goal: string,
    requirements: string
  ): Promise<AIGenerationResponse> {
    // Simulate slight latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      epic: featureDescription || 'AI Generated Feature Set',
      tasks: [
        {
          title: 'Design and architect the database schemas',
          description: `Create normalized models in schema.prisma for ${requirements}. Add appropriate foreign keys, index structures, and cascading delete rules.`,
          priority: Priority.HIGH,
          storyPoints: 5,
          labels: ['Database', 'Backend'],
          suggestedDependencies: [],
        },
        {
          title: 'Implement the REST API routes',
          description: `Write the routes under /api/ for CRUD operations based on project goal: "${goal}". Include input validation using Zod.`,
          priority: Priority.MEDIUM,
          storyPoints: 3,
          labels: ['Backend', 'API'],
          suggestedDependencies: ['Design and architect the database schemas'],
        },
        {
          title: 'Build the interactive client UI',
          description: `Create premium B2B style components using Tailwind and Radix. Add beautiful loading, empty, and success states.`,
          priority: Priority.MEDIUM,
          storyPoints: 3,
          labels: ['Frontend'],
          suggestedDependencies: ['Implement the REST API routes'],
        },
        {
          title: 'Write comprehensive integration tests',
          description: `Test CRUD, validations, permissions, and ensure strict tenant isolation borders are verified.`,
          priority: Priority.HIGH,
          storyPoints: 5,
          labels: ['Testing'],
          suggestedDependencies: ['Implement the REST API routes'],
        },
      ],
    };
  }
}

export class AiTaskService {
  private static provider: IAiProvider;

  private static getProvider() {
    if (!this.provider) {
      const apiKey = process.env.AI_API_KEY;
      if (apiKey && apiKey !== 'mock-key' && apiKey !== 'your_ai_api_key_here') {
        this.provider = new GeminiAiProvider(apiKey);
      } else {
        this.provider = new MockAiProvider();
      }
    }
    return this.provider;
  }

  /**
   * Generates epic/tasks preview from AI.
   * Does NOT save them yet.
   */
  static async previewTasks(
    userId: string,
    workspaceId: string,
    input: {
      projectDescription: string;
      featureDescription: string;
      goal: string;
      requirements: string;
    }
  ): Promise<AIGenerationResponse> {
    await WorkspaceService.verifyAccess(userId, workspaceId);

    const provider = this.getProvider();
    return provider.generateEpicAndTasks(
      input.projectDescription,
      input.featureDescription,
      input.goal,
      input.requirements
    );
  }

  /**
   * Commits the accepted/selected tasks into the database for a specific project.
   */
  static async saveAcceptedTasks(
    userId: string,
    workspaceId: string,
    projectId: string,
    tasks: AIGeneratedTask[]
  ) {
    await WorkspaceService.verifyAccess(userId, workspaceId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER']);

    const project = await prisma.project.findUnique({ where: { id: projectId, workspaceId } });
    if (!project) throw new NotFoundError('Project not found');

    const createdTasks = [];
    const taskMap = new Map<string, string>(); // maps title to created task.id

    // Use transaction to ensure consistency
    for (const tData of tasks) {
      // Validate schema
      const validated = aiGeneratedTaskSchema.parse(tData);

      // Create task
      const task = await TaskService.createTask(userId, workspaceId, projectId, {
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        storyPoints: validated.storyPoints,
        status: TaskStatus.TODO,
      });

      createdTasks.push(task);
      taskMap.set(validated.title, task.id);
    }

    // Process suggested label tagging (create if they don't exist)
    for (let i = 0; i < tasks.length; i++) {
      const validated = tasks[i];
      const createdTask = createdTasks[i];

      if (validated.labels && validated.labels.length > 0) {
        for (const lName of validated.labels) {
          let label = await prisma.label.findFirst({
            where: { name: lName, workspaceId },
          });

          if (!label) {
            label = await prisma.label.create({
              data: { name: lName, color: '#6366f1', workspaceId },
            });
          }

          await prisma.taskLabel.create({
            data: { taskId: createdTask.id, labelId: label.id },
          }).catch(() => {}); // ignore duplicates
        }
      }
    }

    return {
      success: true,
      count: createdTasks.length,
      tasks: createdTasks,
    };
  }
}
