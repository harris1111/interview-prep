---
title: "AI Interview Review Platform"
description: "Full-stack mock interview platform with LLM-powered question generation, CV analysis, and scoring"
status: pending
priority: P1
effort: 40h
branch: devops/update_devops
tags: [feature, fullstack, ai, backend, frontend, database, infra]
blockedBy: []
blocks: []
created: 2026-04-10
---

# AI Interview Review Platform

## Overview

Self-hosted mock interview platform. NestJS backend + React frontend + PostgreSQL + Redis. LLM-powered (OpenAI-compatible) chat interviews with streaming, CV analysis with gap reports, admin-managed question bank & scenario templates. Initially DevOps Engineer focus, extensible to any role/career.

## Architecture

```
React (Vite+TS) ──► NestJS API ──► PostgreSQL (Prisma)
       │                │                 │
       │ SSE Stream     │ BullMQ Jobs     │
       ▼                ▼                 ▼
   Chat UI          Redis            Knowledge Base
                    (cache+queue)    (imported MD files)
                        │
                        ▼
                 OpenAI-compatible LLM
```

## Key Decisions

- **ORM**: Prisma — better DX, type-safe queries, easy migrations
- **Queue**: BullMQ via Redis — CV analysis is async background job
- **Streaming**: SSE (Server-Sent Events) — simpler than WebSocket for unidirectional LLM output
- **Auth**: Email/password + JWT + SMTP (email verify, forgot password, OTP)
- **LLM**: OpenAI-compatible SDK — works with OpenAI, Groq, Together, local Ollama, etc.
- **PDF parsing**: pdf-parse for text extraction → LLM for structured analysis

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Project Setup & Infrastructure](./phase-01-project-setup.md) | Pending | 3h |
| 2 | [Database Schema & Prisma](./phase-02-database-schema.md) | Pending | 4h |
| 3 | [Authentication & User Management](./phase-03-authentication.md) | Pending | 5h |
| 4 | [Admin Panel & CRUD](./phase-04-admin-panel.md) | Pending | 5h |
| 5 | [CV Upload & LLM Analysis](./phase-05-cv-analysis.md) | Pending | 5h |
| 6 | [Interview Engine & Chat](./phase-06-interview-engine.md) | Pending | 8h |
| 7 | [Scoring & Evaluation](./phase-07-scoring.md) | Pending | 4h |
| 8 | [Knowledge Base & Import](./phase-08-knowledge-import.md) | Pending | 3h |
| 9 | [Docker Compose & Deployment](./phase-09-deployment.md) | Pending | 3h |

## Dependencies

- SMTP server (user already has one)
- OpenAI-compatible LLM endpoint (user configures via admin panel)
- Reference markdown files at `E:\backup-mac\...\plans\reports\` for initial data import

## Cross-Plan Dependencies

None — new project, clean slate.
