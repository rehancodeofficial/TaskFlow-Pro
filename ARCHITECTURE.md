# Architecture

TaskFlow Pro uses a full-stack Next.js architecture leveraging the App Router for a mix of Server-Side Rendering (SSR) and Client-Side SPA-like interactivity.

## Application Tiers

1. **Client (Browser):**
   - Renders React 19 components using Tailwind CSS and Radix UI.
   - Manages local state (e.g., active Kanban drag operations using `dnd-kit`).
   - Optimistic UI updates with rollback on failure.

2. **API / Server (Next.js Node/Edge Runtime):**
   - **Server Components:** Used heavily for data fetching to reduce client bundle size and prevent layout shifts.
   - **Route Handlers / Server Actions:** Expose the REST-like endpoints and form mutation handlers.
   - **Middleware:** Secures routes, verifies Clerk/Supabase session tokens, and enforces Tenant (Workspace) isolation.

3. **Data Layer (PostgreSQL & Prisma):**
   - Prisma acts as the strictly typed ORM.
   - All queries must be implicitly scoped to a `workspaceId` to ensure tenant isolation.

4. **External Services:**
   - **Auth:** Clerk (handles user sessions, MFA, password resets).
   - **Storage:** Object storage (e.g., AWS S3 or Supabase Storage) for file attachments.
   - **AI:** External LLM API (e.g., OpenAI or Gemini) for AI Task Generation.

## Multi-Tenancy Strategy
- Row-level isolation using `workspace_id` on almost every table (Projects, Tasks, Sprints, etc.).
- The Next.js Middleware asserts the user's membership to the requested Workspace before allowing access to workspace-specific sub-routes.

## State Management
- **Server State:** Handled natively by Next.js Server Components and Data Caching. Client mutations will use standard `useTransition` or SWR/React Query for specific polling areas.
- **Form State:** Standard controlled components or React Hook Form for complex forms (e.g., task creation).
- **UI State:** Zustand or React Context for isolated UI elements (e.g., sidebar toggling).
