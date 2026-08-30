# Frontend Architecture

## Style

Next.js 15 App Router with role-based route groups.

## Stack

- Next.js 15 + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query (server state)
- Zustand (UI / client state only)
- React Hook Form + Zod
- Lucide React
- React PDF Viewer
- React Dropzone
- TanStack Table
- Apache ECharts
- date-fns

## App Structure

```
apps/web/
  app/
    (auth)/          # login, password reset
    (student)/       # student portal
    (instructor)/    # instructor panel
    (admin)/         # admin / super-admin dashboard
  features/          # feature folders colocated with UI + hooks + schemas
  shared/            # UI primitives, API client, utils
```

## State Rules

- Server data → TanStack Query
- Ephemeral UI state → Zustand or local component state
- Form state → React Hook Form
- Never duplicate API cache into Zustand

## Role Surfaces

### Student Portal (Web + Mobile-ready)

- Dashboard: current month’s 2 courses + progress bar
- Built-in PDF reader
- Assignment download / upload
- Grades & feedback view
- Offline-readable cached modules

### Instructor Panel

- Submission inbox
- Download submissions
- Enter score + written feedback
- Publish grades

### Admin Dashboard

- User management (students, instructors)
- Course & module management
- Drip schedule configuration
- Gradebook + Excel export

## Offline Strategy (Student)

1. Online: download newly unlocked course packages
2. Persist packages in IndexedDB / device storage
3. Offline: open reader from local cache only
4. Online required for: login refresh, assignment submit, new downloads, notifications sync

## Data Optimization

- Prefer compressed PDFs and paginated APIs
- Lazy-load charts and heavy admin tables
- Avoid downloading entire catalogs when only current month is needed
- Show clear online/offline indicators

## Notifications UX

- WebSocket for live in-app alerts
- Browser push when permitted
- Fallback polling only when WebSocket unavailable

## Forms & Validation

- Shared Zod schemas for client validation
- Mirror backend rules; never trust client-only checks
