# Dashboard Module

## Student Dashboard

- Show the 2 courses assigned for the current unlocked month
- Visual progress bar for learning journey
- Upcoming assignment due dates
- Unread notifications count
- Offline content sync status

## Instructor Dashboard

- Pending submissions to grade
- Recently graded items
- Deadline overview for assigned courses

## Admin / Super Admin Dashboard

- User counts (students, instructors)
- Course / month release status
- Submission and grading pipeline health
- Gradebook entry point
- Charts via Apache ECharts (enrollments, completion, grading throughput)

## Rules

- Dashboards are read models; do not embed mutation business logic
- Prefer aggregated queries / cached projections for admin charts
- Always scope data by authorized role
