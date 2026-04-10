# Phase 1: Project Setup & Infrastructure

## Overview
- **Priority**: P1 (Critical — everything depends on this)
- **Status**: Pending
- **Effort**: 3h
- Monorepo setup with NestJS backend, React (Vite) frontend, shared TypeScript config.

## Key Insights
- Monorepo with `apps/api` (NestJS) and `apps/web` (React/Vite) — simple folder structure, no turborepo needed at this scale
- pnpm workspaces for dependency management
- Shared ESLint/Prettier/TypeScript configs

## Requirements

### Functional
- NestJS API server running on port 4000
- React Vite dev server running on port 3000
- Hot reload for both
- Shared TypeScript types package

### Non-Functional
- Node.js 20 LTS
- pnpm workspace
- Strict TypeScript

## Architecture

```
interview-review/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules
│   │   │   ├── common/         # Shared guards, decorators, pipes
│   │   │   ├── config/         # Config module (env validation)
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── components/     # Shared UI components
│       │   ├── pages/          # Route pages
│       │   ├── hooks/          # Custom hooks
│       │   ├── services/       # API client layer
│       │   ├── stores/         # Zustand stores
│       │   └── main.tsx
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   └── shared/                 # Shared types, constants
│       ├── src/
│       │   └── types/
│       ├── tsconfig.json
│       └── package.json
├── docker-compose.yml
├── docker-compose.dev.yml
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── .env.example
└── .gitignore
```

## Related Code Files
- **Create**: All files listed in architecture above
- Root `package.json` with workspace scripts
- `.env.example` with all env vars documented

## Implementation Steps

1. Initialize pnpm workspace at project root
   ```yaml
   # pnpm-workspace.yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```

2. Scaffold NestJS API (`apps/api`)
   - `nest new api --package-manager pnpm --skip-git`
   - Add modules: `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`
   - Add Prisma: `prisma`, `@prisma/client`
   - Add Redis/BullMQ: `@nestjs/bullmq`, `bullmq`, `ioredis`
   - Add validation: `class-validator`, `class-transformer`
   - Add OpenAI SDK: `openai` (works with any compatible endpoint)
   - Add PDF parsing: `pdf-parse`
   - Add email: `@nestjs-modules/mailer`, `nodemailer`
   - Config module with Joi validation for required env vars

3. Scaffold React frontend (`apps/web`)
   - `pnpm create vite web --template react-ts`
   - Add: `react-router-dom`, `zustand`, `axios`, `@tanstack/react-query`
   - Add UI: `@mui/material`, `@emotion/react`, `@emotion/styled` (or Tailwind — user preference)
   - Add markdown: `react-markdown` (for rendering LLM responses)

4. Create shared types package (`packages/shared`)
   - Shared DTOs, enums, constants between API and web
   - Export role types, difficulty levels, interview status enums

5. Create `.env.example`
   ```env
   # Database
   DATABASE_URL=postgresql://user:pass@localhost:5432/interview_review
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   # JWT
   JWT_SECRET=change-me
   JWT_EXPIRY=7d
   # SMTP
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=user
   SMTP_PASS=pass
   SMTP_FROM=noreply@example.com
   # LLM (configured via admin panel, these are defaults)
   LLM_BASE_URL=https://api.openai.com/v1
   LLM_API_KEY=sk-xxx
   LLM_MODEL=gpt-4o
   # App
   APP_PORT=4000
   APP_URL=http://localhost:4000
   WEB_URL=http://localhost:3000
   ```

6. Create `docker-compose.dev.yml` for local Postgres + Redis
   ```yaml
   services:
     postgres:
       image: postgres:16-alpine
       environment:
         POSTGRES_DB: interview_review
         POSTGRES_USER: user
         POSTGRES_PASSWORD: pass
       ports: ["5432:5432"]
       volumes: [pgdata:/var/lib/postgresql/data]
     redis:
       image: redis:7-alpine
       ports: ["6379:6379"]
   volumes:
     pgdata:
   ```

7. Root `package.json` scripts:
   - `dev` — run both API and web in parallel
   - `dev:api` — NestJS watch mode
   - `dev:web` — Vite dev server
   - `build` — build both
   - `db:migrate` — prisma migrate dev
   - `db:seed` — prisma db seed

## Todo List
- [ ] Init pnpm workspace
- [ ] Scaffold NestJS API with all dependencies
- [ ] Scaffold React Vite app with all dependencies
- [ ] Create shared types package
- [ ] Create .env.example
- [ ] Create docker-compose.dev.yml
- [ ] Verify both apps start and connect to DB/Redis
- [ ] Run compile check on both apps

## Success Criteria
- `pnpm dev` starts both API (4000) and Web (3000) with hot reload
- API connects to PostgreSQL and Redis
- Shared types importable from both apps
- No TypeScript compile errors

## Risk Assessment
- **pnpm workspace linking** — can be fiddly; use `workspace:*` protocol
- **NestJS + Prisma integration** — well-documented, low risk

## Next Steps
- Phase 2: Database schema design
