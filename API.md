# API Contract

The Next.js backend will expose RESTful JSON endpoints under `/api`. Standard Next.js Server Actions will also be used for frontend form mutations, but the API contract serves external or complex client integrations.

## Standard Response Format
```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You do not have access to this workspace."
  }
}
```

## Key Endpoints

### Workspaces
- `GET /api/workspaces` - List user's workspaces
- `POST /api/workspaces` - Create new workspace
- `GET /api/workspaces/:id` - Get workspace details (requires membership check)
- `GET /api/workspaces/:id/members` - List members

### Projects
- `GET /api/workspaces/:wId/projects` - List projects
- `POST /api/workspaces/:wId/projects` - Create project
- `PATCH /api/projects/:id` - Update project

### Tasks
- `GET /api/projects/:pId/tasks` - List tasks for a project
- `POST /api/projects/:pId/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task (status, priority, etc.)
- `POST /api/tasks/:id/comments` - Add comment

### AI Generation
- `POST /api/ai/generate-tasks` - Send prompt & context to receive structured JSON tasks.

## Security & Validation
- **Auth:** All endpoints require an active Clerk/Supabase token.
- **Tenant Isolation:** Extract `workspaceId` from the route or database lookup. Verify the authenticated user has a record in `WorkspaceMember` for that ID.
- **Validation:** Zod schemas will parse and strictly validate all incoming request bodies and query parameters.
