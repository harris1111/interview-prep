# Interview Review Platform

A comprehensive AI-powered interview preparation and practice platform built with NestJS and React.

## Tech Stack

### Backend (apps/api)
- **Framework:** NestJS
- **Database:** PostgreSQL with Prisma ORM
- **Cache/Queue:** Redis with BullMQ
- **Authentication:** JWT with Passport
- **AI Integration:** OpenAI-compatible API (configurable base URL)
- **Email:** Nodemailer with Handlebars templates

### Frontend (apps/web)
- **Framework:** React 18 with Vite
- **Routing:** React Router
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **UI Library:** Material-UI (MUI)
- **HTTP Client:** Axios

### Shared (packages/shared)
- TypeScript types and constants shared across backend and frontend

## Project Structure

```
interview-review/
├── apps/
│   ├── api/                # NestJS backend
│   └── web/                # React frontend
├── packages/
│   └── shared/             # Shared types and constants
├── docs/                   # Project documentation
├── plans/                  # Development plans
└── docker-compose.dev.yml  # Local development services
```

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker and Docker Compose (for local services)

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Local Services

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This starts PostgreSQL and Redis containers.

### 3. Configure Environment

Copy `.env.example` to `.env` in the root directory and update values:

```bash
cp .env.example .env
```

Update the following critical values:
- `JWT_SECRET`: Generate a secure random string
- `LLM_BASE_URL`: API base URL (default: `https://api.openai.com/v1`). Change this to use any OpenAI-compatible provider (Ollama, LM Studio, Azure OpenAI, Together AI, etc.)
- `LLM_API_KEY`: Your API key for the LLM provider
- `LLM_MODEL`: Model name (default: `gpt-4o`)
- `SMTP_*`: Your email service credentials

### 4. Initialize Database

```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Start Development Servers

```bash
# Start both frontend and backend
pnpm dev

# Or start individually
pnpm dev:api   # Backend on http://localhost:4000
pnpm dev:web   # Frontend on http://localhost:3000
```

## Available Scripts

### Development
- `pnpm dev` - Start both frontend and backend in development mode
- `pnpm dev:api` - Start only the backend
- `pnpm dev:web` - Start only the frontend

### Build
- `pnpm build` - Build all packages and applications
- `pnpm build:api` - Build only the backend
- `pnpm build:web` - Build only the frontend

### Database
- `pnpm db:migrate` - Run database migrations
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:seed` - Seed database with initial data

### Code Quality
- `pnpm lint` - Run linters across all packages

## Architecture Overview

The platform follows a modular monorepo architecture:

- **Monorepo Management:** pnpm workspaces for efficient dependency management
- **Code Sharing:** Shared types package ensures type safety across frontend and backend
- **API Design:** RESTful API with JWT authentication
- **Real-time Updates:** SSE (Server-Sent Events) for streaming interview responses

## Production Deployment (Docker)

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env with production values
```

### 2. Build and Start

```bash
docker compose up -d --build
```

This starts all services: PostgreSQL, Redis, API (with auto-migration), Web, and Nginx reverse proxy.

The app is accessible at `http://localhost` (or the port set in `APP_EXTERNAL_PORT`).

### Services

| Service    | Description                          |
|------------|--------------------------------------|
| `postgres` | PostgreSQL 16 database               |
| `redis`    | Redis 7 cache & queue                |
| `api`      | NestJS backend (auto-migrates on start) |
| `web`      | React SPA (served via nginx)         |
| `nginx`    | Reverse proxy (routes /api → API, / → SPA) |

## Key Features

- **Admin Panel**: Manage careers, topics, questions, scenarios, users, settings, knowledge base
- **CV Analysis**: Upload PDFs, LLM-powered skill extraction and gap analysis
- **AI Interview Engine**: Multi-round mock interviews with SSE streaming
- **Scoring**: Per-answer, per-round, and overall session scoring with feedback
- **Knowledge Base**: Import markdown files as question banks or study material for RAG context
- **Background Jobs:** BullMQ for asynchronous processing (CV analysis, email sending)
- **Caching:** Redis for session management and performance optimization

## Key Features

1. **User Management:** Authentication, authorization, and profile management
2. **CV Analysis:** AI-powered resume parsing and skill extraction
3. **Interview Sessions:** Real-time practice interviews with AI feedback
4. **Progress Tracking:** Analytics and performance metrics
5. **Email Notifications:** Automated email workflows
6. **Admin Dashboard:** User and content management

## Development Guidelines

- Follow the coding standards in `docs/code-standards.md`
- Keep files under 200 lines (modularize as needed)
- Write tests for new features
- Use conventional commits for version control
- Ensure TypeScript strict mode compliance

## License

Private - All Rights Reserved
