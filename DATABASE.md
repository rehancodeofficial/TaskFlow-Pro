# Database Design (ERD Description)

TaskFlow Pro uses a normalized PostgreSQL relational database managed by Prisma ORM.

## Core Entities

### 1. Identity & Access
- **User:** Global identity (`id`, `email`, `name`, `avatar_url`).
- **Workspace:** The tenant (`id`, `name`, `slug`, `created_at`).
- **WorkspaceMember:** Maps Users to Workspaces (`workspace_id`, `user_id`, `role`). Roles: OWNER, ADMIN, MEMBER, VIEWER.
- **Team:** Sub-groupings in a workspace (`id`, `workspace_id`, `name`).
- **TeamMember:** Maps Users to Teams (`team_id`, `user_id`, `is_lead`).

### 2. Project Management
- **Project:** Container for work (`id`, `workspace_id`, `name`, `description`, `status`).
- **ProjectMember:** Explicit project access if needed (`project_id`, `user_id`, `role`).
- **Sprint:** Time-boxed work period (`id`, `project_id`, `name`, `start_date`, `end_date`, `status`).
- **Goal:** Broad objectives (`id`, `workspace_id`, `project_id`, `name`, `status`, `progress`).

### 3. Task Management
- **Task:** Core work unit (`id`, `project_id`, `sprint_id`, `workspace_id`, `title`, `description`, `status`, `priority`, `story_points`, `due_date`, `reporter_id`).
- **TaskAssignee:** Many-to-many relationship for task assignees.
- **Label:** Reusable tags (`id`, `workspace_id`, `name`, `color`).
- **TaskLabel:** Mapping Tasks to Labels.
- **TimeEntry:** Tracked hours (`id`, `task_id`, `user_id`, `start_time`, `end_time`, `duration`).

### 4. Collaboration & Auditing
- **Comment:** Threaded discussions (`id`, `task_id`, `user_id`, `content`, `parent_id`).
- **File:** Attachment metadata (`id`, `workspace_id`, `task_id`, `url`, `mime_type`, `size`).
- **Notification:** User alerts (`id`, `user_id`, `workspace_id`, `type`, `read`, `content`).
- **AuditLog:** Immutable ledger (`id`, `workspace_id`, `actor_id`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`).

## Foreign Keys & Indexes
- All workspace-specific tables carry a `workspace_id` foreign key.
- Composite indexes on `(workspace_id, project_id)` and `(workspace_id, assignee_id)` to prevent slow queries during tenant isolation checks.
