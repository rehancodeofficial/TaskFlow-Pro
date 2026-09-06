# System Architecture

TaskFlow Enterprise adopts a **Modular Monolith** architecture. This ensures a clean boundary between domains while keeping the deployment and infrastructure simple for the initial SaaS phases. The system is designed to be easily refactored into microservices later if scaling demands it.

## High-Level Flow
1. **Frontend (Next.js)** -> **Backend API (Spring Boot)**
2. **Security Layer:** Intercepts requests, validates JWT, checks RBAC and tenant authorization.
3. **Controller Layer:** Validates input, formats response using standard `ApiResponse`.
4. **Service Layer:** Business logic, cross-module orchestration using Spring Application Events.
5. **Repository Layer:** Interfaces with PostgreSQL using Spring Data JPA.
6. **Infrastructure:** Redis for caching and Websockets for real-time Kanban updates.

## Modules Breakdown
- **auth:** Authentication & JWT Management
- **user:** User Profile Management
- **organization:** Multi-tenant workspace management
- **project:** Project & team allocation
- **task:** Task management & subtasks
- **kanban:** Board layouts & real-time drag-drop sync
- **sprint:** Agile methodologies
- **notification:** Real-time & email alerts
- **analytics:** Dashboard data aggregations

## Database Strategy
We use **Shared Database, Shared Schema** with a `tenant_id` (`organization_id`) column on all tenant-specific tables. All services enforce tenant-id filtering to guarantee data isolation.
