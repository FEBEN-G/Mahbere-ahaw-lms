# Backend Architecture

## Repository layout

```
apps/api/src/
  common/          # guards, filters, interceptors, constants, utils
  config/          # env configuration
  prisma/          # Prisma module/service
  modules/
    auth/
    health/
    ...domain modules
```

## Style

Modular Monolith on NestJS.

Each domain module is independent and owns its controller, service, repository, DTOs, validation, and tests.

## Stack

- NestJS + TypeScript
- Node.js 22 LTS
- Prisma ORM
- PostgreSQL 17
- Redis
- BullMQ
- Multer + MinIO (S3-compatible)
- Pino logging
- Swagger/OpenAPI
- `@nestjs/schedule` for drip content
- WebSocket gateway for real-time notifications

## Layering (Clean Architecture)

```
Controller  →  validates transport concerns, maps DTO ↔ service input
Service     →  business rules, orchestration, authorization checks
Repository  →  Prisma queries only, no business logic
Infrastructure → Redis, BullMQ, MinIO, mail, WebSocket adapters
```

## Module Boundaries

| Module | Owns |
| ------ | ---- |
| Auth | Login, logout, refresh, password reset, sessions |
| Users | Identity, roles, credentials issuance |
| Students | Student profiles, enrollment, registration cohort |
| Instructors | Instructor profiles, course assignments |
| Courses | Courses, months, publish/soft-delete |
| Modules | Reading materials, attachments, video links |
| Assignments | Assignment definitions, due dates, downloads |
| Submissions | Student uploads, replace-before-deadline |
| Grading | Scores, feedback, publish, audit history |
| Notifications | Events, channels, queue workers, WebSocket emit |
| Reports | Gradebook aggregation, Excel export |
| Dashboard | Role-specific summary projections |

## Cross-Cutting

- Global exception filter → consistent API error shape
- Auth guard + RBAC permissions guard on every protected route
- ValidationPipe with whitelist + forbidNonWhitelisted
- Request-scoped logging with correlation IDs
- Rate limiting on auth and upload endpoints

## Scheduling

- Monthly drip unlock via `@nestjs/schedule` + durable job records
- Unlock based on student registration cohort start date + month offset
- Never unlock by wall-clock calendar alone; unlock relative to enrollment

## Queues (BullMQ)

- `notifications` — email, push, in-app
- `exports` — gradebook Excel generation
- `content-release` — drip unlock fan-out

## File Storage

- Never store binary files in PostgreSQL
- Store object key + metadata in DB
- Local disk adapter in development
- MinIO (or AWS S3) in production via storage abstraction

## API Conventions

- REST only for MVP
- Versioned under `/api/v1`
- Paginated list endpoints
- Consistent envelope:

```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "pageSize": 20, "total": 100 },
  "error": null
}
```
