# Submissions Module

## Responsibilities

- Accept student assignment uploads
- Allow replace before deadline
- Provide instructor download access
- Track submission status and timestamps

## Statuses

- `draft` (optional)
- `submitted`
- `late` (if policy allows late after deadline)
- `graded`
- `returned` (feedback published)

## Business Rules

- One active submission per student per assignment (replace overwrites file + metadata before deadline)
- After deadline: reject replace unless admin override
- Online required for upload
- Virus/type/size validation before storage
- Object storage key opaque; original filename kept as metadata only

## Integrations

- Assignments
- Grading
- Notifications (submitted / graded)
