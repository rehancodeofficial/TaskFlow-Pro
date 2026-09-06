# TaskFlow Enterprise

TaskFlow Enterprise is a production-quality Multi-Tenant Project Management SaaS inspired by Jira, Asana, Linear, and Monday.com.

## Features
- Workspaces / Multi-Tenant Isolation
- Project & Team Management
- Sprint Planning
- Kanban Boards with Real-time Updates
- RBAC (Role-Based Access Control)
- Audit & Activity Logging
- Dashboard Analytics

## Architecture
- **Backend:** Java 21, Spring Boot 3+, Spring Security, Spring Data JPA, JWT
- **Frontend:** Next.js, React, Tailwind CSS (Planned)
- **Database:** PostgreSQL (with Flyway for migrations)
- **Caching & Rate Limiting:** Redis
- **Real-Time:** Spring WebSocket

## Setup & Local Development

### Prerequisites
- Docker & Docker Compose
- Java 21
- Maven

### Step-by-step Execution
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Start the infrastructure (PostgreSQL & Redis):
   ```bash
   docker compose up -d postgres redis
   ```
3. Run the backend application:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   *(If you don't have Maven installed, use the wrapper or your IDE)*
4. Access the API documentation (Swagger UI):
   http://localhost:8080/swagger-ui.html

## Project Structure
- `backend/`: Spring Boot Java backend
- `frontend/`: Next.js frontend (Coming Soon)
- `docs/`: Technical documentation (Architecture, ERD, API)
