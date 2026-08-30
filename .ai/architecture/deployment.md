# Deployment Architecture

## Environments

- Local development
- Staging
- Production

## Recommended Topology

```
[Next.js Web] → [NestJS API] → [PostgreSQL]
                     ↓
                   [Redis] ← BullMQ workers
                     ↓
                   [MinIO / S3]
```

WebSocket connections terminate on the API (or dedicated gateway) behind sticky sessions / Redis adapter.

## Local Development

- PostgreSQL via Docker
- Redis via Docker
- Local filesystem storage adapter
- Next.js + NestJS in separate processes (or monorepo scripts)

## Production

- Node.js 22 LTS
- NestJS API as horizontally scalable stateless pods
- BullMQ workers as separate process(es)
- PostgreSQL 17 managed instance + scheduled backups
- Redis managed instance
- MinIO or AWS S3 for objects
- Reverse proxy / TLS termination
- Health checks: `/health/live`, `/health/ready`

## Configuration

All config via environment variables:

- Database URL
- Redis URL
- JWT secrets
- Storage credentials
- CORS origins
- SMTP / push provider keys

## Observability

- Pino structured logs
- Correlation IDs across request + job
- Metrics for queue depth, unlock job success, upload failures

## Release Strategy

- Prisma migrate deploy on release
- Backward-compatible migrations preferred
- Feature flags optional for drip/notification rollouts

## Cross-Platform Note

- Web app ships first via Next.js
- Mobile app (preferred) should reuse the same REST + WebSocket APIs
- Offline package format must be shared between web and mobile clients
