# Phase 9: Docker Compose & Deployment

## Overview
- **Priority**: P2 (Ship it)
- **Status**: Pending
- **Effort**: 3h
- Production Docker Compose with NestJS API, React static build, PostgreSQL, Redis, Nginx reverse proxy.

## Key Insights
- Single `docker-compose.yml` for production
- React built as static files, served by Nginx
- Nginx reverse proxy: `/api/*` → NestJS, `/*` → React static
- Volumes for: PostgreSQL data, Redis data, uploaded CVs
- Health checks on all services
- Environment via `.env` file

## Requirements

### Functional
- Single `docker compose up -d` to run everything
- Nginx handles TLS termination (optional — user can use external reverse proxy)
- Auto-run migrations on API startup
- Seed script runnable as one-off command

### Non-Functional
- Multi-stage Docker builds (small images)
- Named volumes for persistence
- Restart policies: `unless-stopped`
- Resource limits for LLM-heavy operations

## Architecture

```
                    ┌─────────────────┐
                    │     Nginx       │ :80/:443
                    │ (reverse proxy) │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         /api/*          /*            /uploads/*
              │              │              │
              ▼              ▼              ▼
       ┌────────────┐ ┌──────────┐  (static files)
       │  NestJS    │ │  React   │
       │  API :4000 │ │  Static  │
       └─────┬──────┘ └──────────┘
             │
      ┌──────┼──────┐
      │             │
      ▼             ▼
┌──────────┐  ┌──────────┐
│PostgreSQL│  │  Redis   │
│  :5432   │  │  :6379   │
└──────────┘  └──────────┘
```

## Related Code Files
- **Create**: `docker-compose.yml` (production)
- **Create**: `apps/api/Dockerfile`
- **Create**: `apps/web/Dockerfile`
- **Create**: `nginx/nginx.conf`
- **Create**: `nginx/Dockerfile`
- **Modify**: `docker-compose.dev.yml` (add API + web services for full dev stack)
- **Create**: `.dockerignore`
- **Create**: `scripts/entrypoint.sh` (API entrypoint: migrate + start)

## Implementation Steps

1. **API Dockerfile** (multi-stage):
   ```dockerfile
   # Build stage
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
   COPY apps/api/package.json apps/api/
   COPY packages/shared/package.json packages/shared/
   RUN corepack enable && pnpm install --frozen-lockfile
   COPY apps/api apps/api
   COPY packages/shared packages/shared
   RUN pnpm --filter api build
   RUN pnpm --filter api prisma generate

   # Production stage
   FROM node:20-alpine
   WORKDIR /app
   COPY --from=builder /app/apps/api/dist ./dist
   COPY --from=builder /app/apps/api/prisma ./prisma
   COPY --from=builder /app/node_modules ./node_modules
   COPY scripts/entrypoint.sh ./
   RUN chmod +x entrypoint.sh
   EXPOSE 4000
   CMD ["./entrypoint.sh"]
   ```

2. **Web Dockerfile** (multi-stage):
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
   COPY apps/web/package.json apps/web/
   COPY packages/shared/package.json packages/shared/
   RUN corepack enable && pnpm install --frozen-lockfile
   COPY apps/web apps/web
   COPY packages/shared packages/shared
   RUN pnpm --filter web build

   FROM nginx:alpine
   COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
   ```

3. **Nginx config**:
   - Route `/api` → `http://api:4000`
   - Route `/uploads` → static file serving from volume
   - Route `/*` → React SPA (try_files $uri /index.html)
   - Gzip compression
   - Security headers

4. **API entrypoint script**:
   ```bash
   #!/bin/sh
   npx prisma migrate deploy
   node dist/main.js
   ```

5. **docker-compose.yml**:
   ```yaml
   services:
     postgres:
       image: postgres:16-alpine
       environment:
         POSTGRES_DB: ${DB_NAME}
         POSTGRES_USER: ${DB_USER}
         POSTGRES_PASSWORD: ${DB_PASS}
       volumes: [pgdata:/var/lib/postgresql/data]
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
       restart: unless-stopped

     redis:
       image: redis:7-alpine
       volumes: [redisdata:/data]
       healthcheck:
         test: ["CMD", "redis-cli", "ping"]
       restart: unless-stopped

     api:
       build:
         context: .
         dockerfile: apps/api/Dockerfile
       env_file: .env
       depends_on:
         postgres: { condition: service_healthy }
         redis: { condition: service_healthy }
       volumes: [uploads:/app/uploads]
       restart: unless-stopped

     web:
       build:
         context: .
         dockerfile: apps/web/Dockerfile
       restart: unless-stopped

     nginx:
       build: ./nginx
       ports: ["80:80"]
       depends_on: [api, web]
       volumes: [uploads:/uploads:ro]
       restart: unless-stopped

   volumes:
     pgdata:
     redisdata:
     uploads:
   ```

## Todo List
- [ ] Create API Dockerfile (multi-stage)
- [ ] Create Web Dockerfile (multi-stage)
- [ ] Create Nginx config + Dockerfile
- [ ] Create API entrypoint script (migrate + start)
- [ ] Create production docker-compose.yml
- [ ] Create .dockerignore
- [ ] Create .env.example for production
- [ ] Test full stack with `docker compose up --build`
- [ ] Verify migrations run on startup
- [ ] Verify CV uploads persist across restarts

## Success Criteria
- `docker compose up -d` starts all services
- App accessible at http://localhost
- API migrations auto-run on first start
- Data persists across container restarts
- CV file uploads persist via volume

## Risk Assessment
- **Prisma migration on startup**: if migration fails, API won't start. Mitigation: health check on API, compose restart policy
- **pnpm workspace in Docker**: needs careful COPY ordering. Test build thoroughly.
