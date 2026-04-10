# AGENTS.md — Interview Review Platform

## Project Context

AI-powered mock interview platform. Monorepo: `apps/api` (NestJS), `apps/web` (React/Vite), `packages/shared`.

## Quick Reference

| Item | Value |
|------|-------|
| Package manager | pnpm (workspaces) |
| Backend | NestJS 10, TypeScript, Prisma 5.22, BullMQ |
| Frontend | React 18, Vite 5, MUI 6, Zustand, React Router 6 |
| Database | PostgreSQL 16 (Docker) |
| Cache/Queue | Redis 7 (Docker) |
| Auth | JWT + Passport, email/password |
| LLM | OpenAI-compatible SDK (configurable provider) |
| Dev admin | `admin@admin.com` / `admin` |

## File Structure

- Backend modules: `apps/api/src/modules/{auth,admin,cv,interview,knowledge,mail,llm}/`
- Frontend pages: `apps/web/src/pages/{admin,auth,cv,interview}/`
- Frontend components: `apps/web/src/components/{admin,auth,cv,interview}/`
- Prisma schema: `apps/api/prisma/schema.prisma`
- Env config: `.env` at project root

## Conventions

- kebab-case file names
- Files under 200 lines
- Conventional commits
- TypeScript strict mode
- NestJS modular architecture (one module = one domain)
- React nested route layouts (MainLayout for users, AdminLayout for admin)

## Known Issues & Fixes

See README.md Troubleshooting section for:
- Windows Hyper-V port conflicts with Redis
- NestJS incremental build issues
- CORS configuration
- Prisma authentication errors
