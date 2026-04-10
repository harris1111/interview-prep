# Journal: AI Interview Review Platform — Plan Created

**Date**: 2026-04-10
**Session**: Planning phase
**Plan**: `plans/260410-2031-interview-platform/`

## What Happened

Created 9-phase implementation plan for a self-hosted AI mock interview platform.

## Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Backend framework | NestJS | User has NestJS experience (trading system), modular architecture fits complex domain |
| ORM | Prisma | Better type safety on relations, declarative migrations, superior DX over TypeORM |
| Streaming approach | fetch + ReadableStream | EventSource can't send auth headers or POST bodies — critical limitation for authenticated streaming |
| Queue system | BullMQ (Redis) | CV analysis is async 30-60s job; BullMQ has native NestJS integration, retry/DLQ support |
| PDF parsing | pdf-parse | Fastest for text-only extraction; sufficient quality for LLM input |
| Interview UX | Chat-based with SSE | ChatGPT-like experience; LLM acts as interviewer, asks follow-ups |
| Scoring | Per-answer (0-10) + round + overall | 3-level scoring provides granular feedback without overwhelming cost |
| Auth | Email/password + JWT + SMTP | User already has SMTP; no OAuth needed for solo/small team use |

## Architecture

- **Stack**: React (Vite) + NestJS + PostgreSQL + Redis + OpenAI-compatible LLM
- **14 Prisma models**: Users, Careers, Topics, Questions, ScenarioTemplates, RoundTemplates, InterviewSessions, Rounds, Messages, CvUploads, CvAnalysis, KnowledgeEntries, AppSettings
- **Deploy**: Docker Compose (Nginx + API + Web + Postgres + Redis)

## Data Source

Existing interview prep materials (39 markdown files) to be imported:
- Question banks with Q/A pairs, categorized by topic and difficulty
- Study guides chunked by heading for knowledge base RAG context
- Scenario simulations as reference templates

## Phases Summary

1. Project setup (monorepo, tooling) — 3h
2. Database schema (Prisma, 14 models, seed) — 4h
3. Auth (JWT, SMTP verify/reset) — 5h
4. Admin panel (full CRUD) — 5h
5. CV analysis (upload → LLM extraction + gap report) — 5h
6. Interview engine (chat + SSE streaming) — 8h (core)
7. Scoring (per-answer + summaries) — 4h
8. Knowledge import (markdown parser) — 3h
9. Docker deployment — 3h

**Total estimated effort**: ~40h

## Open Items

- Researcher 2 (DB schema validation) still running at session end
- UI library choice not finalized (MUI vs Tailwind) — decide in Phase 1
- Scanned PDF handling: detect and warn, not supported in v1
