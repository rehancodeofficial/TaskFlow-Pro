import { z } from 'zod';

// Shared validations that can be used by both API and Frontend

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().max(500).optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

// Foundation for error formatting
export function formatZodError(error: z.ZodError) {
  return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}
