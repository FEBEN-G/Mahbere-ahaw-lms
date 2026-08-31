# Mahbere Ahaw Seminary LMS

Distance Learning Management System for monthly modules, assignment submission, grading, and admin oversight — with offline reading support for low-connectivity environments.

## Stack

| Area | Technology |
| ---- | ---------- |
| Web | Next.js 15, TypeScript, Tailwind, TanStack Query, Zustand, Zod |
| API | NestJS, Prisma, PostgreSQL 17, Redis, JWT + Argon2 |
| Storage | Local (dev) / MinIO (prod-ready) |
| Context | `.ai/` architecture + module docs |

## Monorepo

```
apps/api   NestJS REST API (`/api/v1`) + Swagger (`/docs`)
apps/web   Next.js student / instructor / admin portals
.ai/       AI context engineering (source of truth for conventions)
```

## Quick start

### 1. Environment

```bash
cp .env.example .env
cp .env.example apps/api/.env
```

Copy web public vars into `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

### 2. Infrastructure

Start **Docker Desktop** first (required). Then:

```bash
npm run docker:up
```

Compose Postgres is exposed on **host port 55432** so it does not collide with a local Windows PostgreSQL on 5432/5433.

### 3. Install & migrate

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -w @lms/api -- --name init
npm run prisma:seed -w @lms/api
```

Note the space after `--` before `--name`.

### 4. Run

From the repo root:

```bash
npm run dev
```

Or separately:

```bash
npm run dev:api
npm run dev:web
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1
- Swagger: http://localhost:4000/docs

### Seed accounts (all roles)

Defaults match `apps/api/prisma/seed.ts`. Override with `SEED_*` variables in
`apps/api/.env` (see `.env.example`).

| Role | Email | Password | Portal |
| ---- | ----- | -------- | ------ |
| Super Admin | `admin@mahbereahaw.org` | `Admin@mahbereahawlms316` | `/admin` |
| Instructor | `instructor@mahbereahaw.org` | `Instructor@mahbereahawlms` | `/instructor` |
| Student | `student@mahbereahaw.org` | `Student@mahbereahaw` | `/student` |

Re-seed anytime: `npm run prisma:seed -w @lms/api`

## Architecture notes

- Modular NestJS monolith; each feature owns controller → service → repository
- Drip unlock: `unlockedMonth = floor(daysSince(cohortStartedAt) / 30) + 1`
- Auth: JWT access + rotating refresh tokens, RBAC permissions
- Notifications will be queued (BullMQ) and delivered over WebSocket

See `AGENTS.md` and `.ai/` before implementing features.
