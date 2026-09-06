# TaskFlow Enterprise

A production-quality, **multi-tenant Project Management SaaS** built with Java 21, Spring Boot 3, PostgreSQL, Redis, and WebSockets. Inspired by Jira, Asana, and Linear — but built from scratch with enterprise-grade architecture.

---

## 🚀 Features

- **Multi-Tenant Architecture** — Organization-scoped data isolation with `X-Tenant-ID` enforcement
- **JWT Authentication** — Short-lived access tokens (15m) + long-lived refresh tokens (7d) with rotation
- **Role-Based Access Control (RBAC)** — OWNER, ADMIN, MANAGER, MEMBER, VIEWER roles
- **Project Management** — Organizations → Teams → Projects → Tasks hierarchy
- **Kanban Boards** — Customizable columns with fractional position ordering
- **Real-Time Updates** — WebSocket/STOMP broadcasting for task movements and notifications
- **Agile Sprint Management** — Plan, start, complete, and cancel sprints
- **Collaboration** — Task comments, @mentions, activity logs
- **In-App Notifications** — Real-time push via WebSocket
- **Dashboard Analytics** — Metrics cached in Redis (5-min TTL)
- **Optimistic Locking** — `@Version` on tasks to handle concurrent updates
- **Flyway Migrations** — All schema changes versioned and reproducible
- **Docker Compose** — One-command local startup

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.2, Spring Security |
| Database | PostgreSQL 16 |
| Migrations | Flyway |
| Cache | Redis 7 |
| Real-Time | Spring WebSocket (STOMP) |
| Auth | JWT (JJWT 0.12) |
| Build | Maven |
| Container | Docker, Docker Compose |
| CI/CD | GitHub Actions |

---

## 🏗 Architecture

```
Frontend (Next.js - coming soon)
        ↓
API Layer (/api/v1/*)
        ↓
Security Layer (JwtAuthenticationFilter → TenantFilter)
        ↓
Controller → Service → Repository
        ↓
PostgreSQL (multi-tenant, shared schema)

Redis ← Caching (analytics) + Rate Limiting
WebSocket ← Real-Time Kanban + Notifications
```

**Modular Monolith** — each domain is self-contained (`auth`, `user`, `organization`, `team`, `project`, `task`, `sprint`, `kanban`, `comment`, `activity`, `notification`, `analytics`).

---

## ⚡ Quick Start (Local)

### Prerequisites
- Docker & Docker Compose
- Java 21
- Maven

### 1. Clone and configure
```bash
git clone https://github.com/rehancodeofficial/TaskFlow-Pro.git
cd TaskFlow-Pro
cp .env.example .env
```

### 2. Start infrastructure
```bash
docker compose up -d postgres redis
```

### 3. Run the backend
```bash
cd backend
./mvnw spring-boot:run
```

### 4. Or start everything with Docker
```bash
docker compose up --build
```

### 5. Access the API
- **API Base:** `http://localhost:8080/api/v1`
- **Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **Health Check:** `http://localhost:8080/api/v1/health`

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and update:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskflow
DB_USERNAME=postgres
DB_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=<base64-encoded-secret-min-32-chars>
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Login and get tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |

### Organizations (require Bearer token)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/organizations` | Create organization |
| GET | `/api/v1/organizations/{id}` | Get organization |
| POST | `/api/v1/organizations/{id}/members` | Add member |

### Projects, Teams, Tasks (require `X-Tenant-ID` header)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/teams` | Create team |
| POST | `/api/v1/projects` | Create project |
| POST | `/api/v1/projects/{id}/tasks` | Create task |
| PATCH | `/api/v1/tasks/{id}` | Update task status |
| PUT | `/api/v1/tasks/{id}/move` | Move task on Kanban |
| POST | `/api/v1/tasks/{id}/comments` | Add comment |
| POST | `/api/v1/projects/{id}/sprints` | Create sprint |
| PATCH | `/api/v1/sprints/{id}/status` | Start/complete sprint |
| GET | `/api/v1/analytics/dashboard` | Dashboard metrics |
| GET | `/api/v1/notifications` | User notifications |

---

## 🗄 Database Migrations (Flyway)

| Version | Description |
|---|---|
| V1 | Users, Organizations, Organization Members |
| V2 | Refresh Tokens |
| V3 | Teams, Projects, Members |
| V4 | Tasks, Subtasks, Labels |
| V5 | Kanban Columns |
| V6 | Sprints |
| V7 | Comments, Activity Logs, Notifications |

---

## 🔒 Security

- Passwords hashed with **BCrypt**
- JWT validated on every request via `JwtAuthenticationFilter`
- Tenant isolation enforced via `TenantFilter` — users cannot access data from other organizations
- `@Version` optimistic locking prevents concurrent overwrite conflicts (returns `409` on conflict)

---

## 📄 Documentation

- [`docs/architecture.md`](docs/architecture.md) — System architecture and module breakdown
