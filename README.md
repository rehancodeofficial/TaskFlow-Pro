# TaskFlow Pro

**AI-powered project, team, and workflow management for modern businesses.**

TaskFlow Pro is a complete project and workflow management platform built for multi-tenant organizations. It provides teams with a robust suite of tools to plan, track, and collaborate on work.

## Core Features
- **Workspace Isolation:** Strict tenant boundaries for businesses and organizations.
- **Project & Task Management:** Kanban boards, task assignments, tracking, and sprints.
- **AI Task Generation:** Automatically generate structured tasks and epics.
- **Collaboration:** Comments, threaded replies, file attachments.
- **Analytics:** Workload tracking, burndown charts, and progress reports.
- **Role-Based Access Control:** Configurable permissions for owners, admins, managers, members, and viewers.

## Technology Stack
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS v4
- **Backend:** Next.js Route Handlers & Server Actions
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** Clerk / Supabase Auth (Clerk currently configured)
- **UI Components:** Radix UI, lucide-react, dnd-kit

## Development Setup

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` based on `.env.example`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   DATABASE_URL="postgresql://..."
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   AI_API_KEY=
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   # For seed data:
   npm run db:seed
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Documentation
- [Architecture Details](ARCHITECTURE.md)
- [Database Schema](DATABASE.md)
- [API Contract](API.md)
- [Design Guidelines](DESIGN.md)
