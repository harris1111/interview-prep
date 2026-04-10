# Copilot Instructions — Interview Review Platform

## Project Overview

AI-powered mock interview platform. Monorepo with pnpm workspaces:
- `apps/api` — NestJS 10 backend (TypeScript, Prisma, BullMQ, JWT/Passport)
- `apps/web` — React 18 frontend (Vite, MUI, Zustand, React Router, TanStack Query)
- `packages/shared` — Shared TypeScript types and constants

## Architecture

```
React (Vite+TS) → NestJS API → PostgreSQL (Prisma ORM)
      │                │
      │ SSE Stream     │ BullMQ Jobs → Redis
      ▼                ▼
   Chat UI        OpenAI-compatible LLM
```

## Key Patterns

### Backend (apps/api)
- NestJS modular architecture: one module per domain (`auth`, `admin`, `cv`, `interview`, `knowledge`, `mail`, `llm`)
- Prisma ORM with soft-delete middleware on relevant models
- JWT auth via Passport strategies (`JwtStrategy`, `JwtRefreshStrategy`)
- Guards: `JwtAuthGuard`, `RolesGuard` with `@Roles()` decorator
- BullMQ processors for async jobs (CV analysis, emails)
- SSE streaming for interview chat responses
- Config via `@nestjs/config` with typed configuration (`configuration.ts`)
- `.env` at project root — `envFilePath: ['.env', '../../.env']` in AppModule

### Frontend (apps/web)
- React Router 6 with nested layouts:
  - `MainLayout` — top navbar for authenticated users (CV, Interview, Scores)
  - `AdminLayout` — sidebar layout for admin panel
- Zustand for auth state (persisted to localStorage)
- Axios with interceptor for JWT token injection and refresh
- TanStack Query for server state
- MUI v6 components throughout

### Shared (packages/shared)
- Enums: `UserRole`, `InterviewStatus`, `RoundType`, `DifficultyLevel`, `CvAnalysisStatus`
- DTOs and type interfaces shared between frontend and backend

## Database

- PostgreSQL 16 via Prisma ORM
- 14 models: User, Career, Topic, Question, ScenarioTemplate, RoundTemplate, InterviewSession, Round, Message, CvUpload, CvAnalysis, KnowledgeEntry, AppSetting, RefreshToken
- Schema at `apps/api/prisma/schema.prisma`
- Seed creates dev admin: `admin@admin.com` / `admin` (gated by NODE_ENV !== 'production')

## Environment

- `.env` lives at project root (not in apps/api)
- Redis default port 6379 may conflict with Windows Hyper-V — check `docker-compose.dev.yml` for actual port
- `WEB_URL` env var controls CORS origin — must match frontend's actual URL
- `incremental: false` in `apps/api/tsconfig.json` to prevent NestJS watch mode issues

## Conventions

- File naming: kebab-case (e.g., `admin-layout.tsx`, `cv-analysis.ts`)
- Keep files under 200 lines; split into focused modules
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- TypeScript strict mode enabled
- No mocks or fake data in seeds or tests — use real implementations
- Error handling via NestJS exception filters (backend) and axios interceptors (frontend)

## Common Commands

```bash
pnpm dev                          # Start both frontend and backend
pnpm dev:api                      # Backend only (http://localhost:4000/api)
pnpm dev:web                      # Frontend only (http://localhost:3000)
docker-compose -f docker-compose.dev.yml up -d   # Start Postgres + Redis
cd apps/api && npx prisma db push                 # Sync schema
cd apps/api && npx prisma db seed                 # Seed admin user
cd apps/api && npx prisma studio                  # DB GUI
```

## Known Gotchas

1. **NestJS "Cannot find module dist/main"**: Delete `dist/` and `tsconfig.tsbuildinfo` in `apps/api/`, then restart
2. **CORS failures**: Ensure `WEB_URL` in `.env` matches Vite's actual port
3. **Redis port conflicts (Windows)**: Hyper-V reserves port ranges; use port 6500 if 6379 is blocked
4. **Prisma auth errors**: `DATABASE_URL` credentials must match `docker-compose.dev.yml` `POSTGRES_USER`/`POSTGRES_PASSWORD`
5. **SMTP warnings in dev**: Expected — no real SMTP server configured in development
