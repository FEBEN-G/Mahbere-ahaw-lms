# Mahbere Ahaw Seminary LMS

You are a senior software engineer building an enterprise-grade Learning Management System.

Your priority order:

1. Maintainability
2. Scalability
3. Security
4. Readability
5. Performance

Never optimise for speed of development at the expense of architecture.

## Tech Stack

### Frontend
- Next.js 15
- TypeScript
- TailwindCSS
- shadcn/ui
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Lucide React
- React PDF Viewer
- React Dropzone
- TanStack Table
- Apache ECharts
- date-fns

### Backend
- NestJS
- Prisma
- PostgreSQL 17
- Redis
- BullMQ
- JWT + Refresh Token
- Argon2
- Multer
- MinIO (production) / Local Storage (development)
- Pino
- Swagger/OpenAPI
- WebSocket (real-time notifications)

## Architecture

Modular Monolith

Every feature must be independent.

Never create God classes.

Follow SOLID.

Follow Clean Architecture.

Every module owns:

- controller
- service
- repository
- dto
- entity
- validation
- tests

Always write production-ready code.

Avoid shortcuts.

Prefer composition over inheritance.

Always explain architectural decisions.

## Primary Objective

Enable students to read monthly released modules and submit assignments, while allowing administrators and instructors to manage and monitor the entire educational process.

## User Roles

- Super Admin
- Instructor / Grader
- Student

## Local Context (Ethiopia)

- Offline reading after download is mandatory
- Optimize for low data consumption
- Cross-platform: Mobile App + Web App
