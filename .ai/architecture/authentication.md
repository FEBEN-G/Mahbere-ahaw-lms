# Authentication & Authorization

## Goals

Secure identity for Super Admin, Instructor, and Student with JWT access tokens and rotating refresh tokens.

## Mechanisms

- Access Token: short-lived JWT
- Refresh Token: longer-lived, stored hashed server-side, rotatable
- Password hashing: Argon2
- Session tracking + login audit

## Rules

- Never store plain passwords
- Never trust client-provided role
- Always verify permissions server-side
- Every protected endpoint requires authentication
- Authorization checks use permission constants, never string literals scattered in code

## Roles

| Role | Capabilities |
| ---- | ------------ |
| Super Admin | Full system control, user registration, courses, monitoring |
| Instructor | Review submissions, grade, feedback |
| Student | Read unlocked content, submit assignments, view grades |

## Login Flow

1. Validate credentials
2. Verify account active / not soft-deleted
3. Issue access + refresh tokens
4. Persist session metadata (user agent, IP hash, issuedAt)
5. Write audit login event

## Refresh Flow

1. Validate refresh token exists and is not revoked
2. Rotate refresh token
3. Issue new access token
4. Invalidate previous refresh token

## Password Reset

- Time-limited single-use token
- Rate-limited request endpoint
- Never reveal whether email exists in responses

## RBAC Pattern

```
Permission enum → RolePermission mapping → Guard checks required permission
```

Controllers declare required permissions; services may re-check for sensitive mutations.
