# Security Architecture

## Defaults

- Security by default on every endpoint
- Validate input, authorize actor, sanitize files, log failures

## HTTP Hardening

- Helmet
- CORS allowlist from environment
- Rate limiting (auth, password reset, uploads)
- Request size limits

## Auth Security

- Argon2 password hashing
- JWT secret from environment
- Refresh token rotation + revocation
- Lockout / throttle after repeated failures (configurable)

## Authorization

- RBAC with explicit permissions
- Never authorize by role name strings in business logic alone
- Object-level checks (student can only access own submissions)

## File Upload Security

- Allowlist MIME types: PDF, DOCX, PNG, JPG
- Max size enforced (Multer + service re-check)
- Virus/malware scanning hook point for production
- Store outside web root / object storage only
- Generate opaque object keys; never use user filenames as storage keys

## Data Protection

- Never commit `.env`
- Secrets only via environment / secret manager
- PII minimization in logs
- Soft-delete retention policy for educational records

## API Responses

- Do not leak stack traces in production
- Consistent error codes
- No internal IDs in public error messages unless necessary

## Offline Client Considerations

- Cached content may contain educational materials; encrypt at rest on device when platform supports it
- Tokens must not be stored in insecure locations
- Clear offline cache on logout
