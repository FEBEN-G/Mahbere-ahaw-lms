# Database Standards

## Engine

- PostgreSQL 17
- Prisma ORM
- Prisma Migrate for all schema changes

## Identity

- UUID primary keys on every table
- Soft delete via `deletedAt`
- Audit timestamps: `createdAt`, `updatedAt`
- Track `createdBy` / `updatedBy` where business-relevant

## Core Entities (conceptual)

- User
- Role / Permission (RBAC)
- StudentProfile
- InstructorProfile
- Course
- CourseMonth (drip bucket)
- Module (reading unit under a course)
- Attachment (PDF / Word / video link metadata)
- Assignment
- Submission
- Grade
- GradeHistory
- Enrollment (student + cohort start date)
- Notification
- Session / RefreshToken
- AuditLog

## Required Indexes

- `User.email` (unique)
- `Enrollment.studentId`
- `Course.id` / `Course.monthNumber`
- `Module.courseId`
- `Assignment.courseId`
- `Submission.assignmentId`, `Submission.studentId`
- `Grade.submissionId`
- `Notification.userId`, `Notification.createdAt`

## Integrity

- Foreign keys everywhere
- Transactions for multi-step operations (enroll + unlock month 1, grade publish + notify)
- Soft delete only for courses/users/content where history matters

## Query Rules

- Optimise for read-heavy workloads
- Avoid N+1 (use Prisma `include` / `select` deliberately)
- Paginate all list endpoints
- Never raw SQL unless justified and reviewed

## Backup

- Scheduled PostgreSQL backups in production
- Point-in-time recovery where hosting allows

## Unlock Model

Enrollment stores `cohortStartedAt`.

Unlocked month for a student:

```
unlockedMonth = floor(daysSince(cohortStartedAt) / 30) + 1
```

Student may only access courses/modules where `course.monthNumber <= unlockedMonth`.
