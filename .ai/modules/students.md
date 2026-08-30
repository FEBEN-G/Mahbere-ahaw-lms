# Students Module

## Responsibilities

- Student profile management
- Enrollment into program cohort
- Track cohort start date (drives drip unlock)
- Student-facing progress projection inputs

## Business Rules

- Every student has exactly one active enrollment cohort start
- Month unlock is computed from `cohortStartedAt`
- On registration, Month 1 courses unlock immediately (example: 2 courses)
- Exactly 30 days later, next month unlocks automatically
- Students only see unlocked months

## Data

- StudentProfile linked to User
- Enrollment (`studentId`, `cohortStartedAt`, status)

## Integrations

- Courses (visibility)
- Dashboard (current month courses + progress)
- Notifications (new month unlocked)
