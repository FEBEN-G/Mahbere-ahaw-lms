# Users Module

## Responsibilities

- Register users (students, instructors, admins)
- Issue login credentials
- Assign roles and permission levels
- Activate / deactivate accounts
- Soft-delete users

## Actors

- Super Admin (primary)
- System (password reset flows)

## Business Rules

- Email is unique
- Role assignment uses permission catalog, not ad-hoc strings
- Credentials issued by admin; students do not self-register unless explicitly enabled later
- Deactivated users cannot authenticate
- Soft delete preserves historical submissions and grades

## Owns

- User entity
- Role / permission assignment APIs
- Credential issuance workflow
