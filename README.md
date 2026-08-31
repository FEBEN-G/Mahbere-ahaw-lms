# Mahbere Ahaw Seminary LMS

Distance Learning Management System for monthly modules, assignment submission, grading, and admin oversight — with offline reading support for low-connectivity environments.

## Stack

| Area | Technology |
| ---- | ---------- |
| Web | Next.js 15, TypeScript, Tailwind, TanStack Query, Zustand, Zod |
| API | NestJS, Prisma, PostgreSQL 17, Redis, JWT + Argon2 |
| Storage | Local disk (dev + Render with Persistent Disk); MinIO/R2 optional later |
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

Set `SEED_*` credentials in `apps/api/.env` (see `.env.example`), then run
`npm run prisma:seed -w @lms/api`. **Do not commit real passwords to git.**

| Role | Email | Portal |
| ---- | ----- | ------ |
| Super Admin | `admin@mahbereahaw.org` | `/admin` |
| Instructor | `instructor@mahbereahaw.org` | `/instructor` |
| Student | `student@mahbereahaw.org` | `/student` |

Passwords are configured only via `SEED_*` environment variables.

On **Render**, open the API service **Shell** and run (fast — uses compiled seed, not ts-node):

```bash
npm run render:seed:api
```

Wait until you see `Seed complete.` The Web Shell may show **Reconnecting** if the session drops; run the command again after reconnect if login still fails.

## Deploy on Render

Use these commands in the Render dashboard (production installs skip devDependencies by default).

**API — Build Command:**
```bash
npm run render:build:api
```

**API — Start Command:**
```bash
API_PORT=$PORT npm run render:start:api
```

**Web — Build Command:**
```bash
npm run render:build:web
```

**Web — Start Command:**
```bash
npm run start -w @lms/web
```

**API — Health Check Path:** `/api/v1/health/live`

Set environment variables in Render (not in committed `.env` files). Use Internal URLs for Postgres and Key Value (Redis).

### File storage (this phase — local, no R2)

Uploads (PDFs, assignments) are stored on the **API server disk**, not in Postgres.

1. On the **API** service in Render: **Disks** → add **Persistent Disk** (e.g. 1–10 GB), mount path **`/data/uploads`**
2. Set on the API service:

```env
STORAGE_DRIVER=local
STORAGE_LOCAL_PATH=/data/uploads
```

3. Remove or ignore `MINIO_*` variables for now — they are only needed if you switch to `STORAGE_DRIVER=minio` later.

Without a Persistent Disk, uploaded files are **lost on redeploy**. The disk is shared by all users (students, instructors, admins) through the API.

**`EACCES: permission denied, mkdir '/data/uploads'`** — you set `STORAGE_LOCAL_PATH` but the API cannot create that folder. Either:

1. **Recommended:** API service → **Disks** → add Persistent Disk → mount path **`/data/uploads`** → **Redeploy** (path must match `STORAGE_LOCAL_PATH` exactly), or
2. **Temporary only** (boot without disk; uploads wiped on redeploy): `STORAGE_LOCAL_PATH=/opt/render/project/src/storage/uploads`

Persistent Disks require a **paid** Render instance (not the free web tier).

### API environment (minimum)

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Internal URL from Render Postgres |
| `REDIS_URL` | Internal URL from Key Value |
| `STORAGE_DRIVER` | `local` |
| `STORAGE_LOCAL_PATH` | `/data/uploads` (must match disk mount) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | 32+ chars each |
| `CORS_ORIGINS` | Your web URL(s), e.g. `https://mahbere-ahaw-lms-web.onrender.com` |
| `WEB_PUBLIC_URL` | Same web URL — **required**; also added to CORS automatically |
| `SEED_*` | For seeding via Shell (not committed) |

### Web environment

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://your-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `https://your-api.onrender.com` |

## Architecture notes

- Modular NestJS monolith; each feature owns controller → service → repository
- Drip unlock: `unlockedMonth = floor(daysSince(cohortStartedAt) / 30) + 1`
- Auth: JWT access + rotating refresh tokens, RBAC permissions
- Notifications will be queued (BullMQ) and delivered over WebSocket

See `AGENTS.md` and `.ai/` before implementing features.
