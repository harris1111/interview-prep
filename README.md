# Interview Review Platform

A comprehensive AI-powered interview preparation and practice platform built with NestJS and React.

## Features

- **CV Analysis**: Upload PDF resumes → AI extracts skills, experience → generates gap reports per career
- **AI Mock Interviews**: Multi-round chat-based interviews with SSE streaming (ChatGPT-like UX)
- **Scoring & Feedback**: Per-answer (0-10), per-round, and overall session scoring with detailed feedback
- **Admin Panel**: Full CRUD for careers, topics, questions, scenarios, users, settings, knowledge base
- **Knowledge Import**: Import markdown files as question banks or study material for interview context
- **Background Jobs**: BullMQ for async CV analysis, email sending
- **Auth**: Email/password + JWT + SMTP (email verification, forgot password)

## Tech Stack

### Backend (apps/api)
- **Framework:** NestJS 10
- **Database:** PostgreSQL 16 with Prisma ORM 5.22
- **Cache/Queue:** Redis 7 with BullMQ
- **Authentication:** JWT with Passport
- **AI Integration:** OpenAI-compatible API (configurable base URL)
- **Email:** Nodemailer with Handlebars templates

### Frontend (apps/web)
- **Framework:** React 18 with Vite 5
- **Routing:** React Router 6
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **UI Library:** Material-UI (MUI) 6
- **HTTP Client:** Axios

### Shared (packages/shared)
- TypeScript types and constants shared across backend and frontend

## Project Structure

```
interview-review/
├── apps/
│   ├── api/                # NestJS backend
│   │   ├── prisma/         # Schema, migrations, seed
│   │   └── src/
│   │       ├── modules/    # auth, admin, cv, interview, knowledge, mail, llm
│   │       └── common/     # guards, decorators, filters, middleware
│   └── web/                # React frontend
│       └── src/
│           ├── components/ # admin/, auth/, cv/, interview/, main-layout
│           ├── pages/      # admin/, auth/, cv/, interview/, home-page
│           ├── services/   # API service clients
│           ├── stores/     # Zustand stores
│           └── hooks/      # Custom hooks
├── packages/
│   └── shared/             # Shared types and constants
├── docs/                   # Project documentation
├── plans/                  # Development plans & research
├── docker-compose.dev.yml  # Local dev services (Postgres + Redis)
└── docker-compose.yml      # Production deployment
```

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker and Docker Compose (for PostgreSQL and Redis)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Local Services

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379) containers.

> **Windows Users**: If Redis fails to start, see [Troubleshooting](#troubleshooting) for Hyper-V port conflicts.

### 3. Configure Environment

```bash
cp .env.example .env
```

Update the following critical values in `.env`:
- `JWT_SECRET`: Generate a secure random string
- `LLM_BASE_URL`: Your LLM provider's base URL (OpenAI, Ollama, Groq, Together, etc.)
- `LLM_API_KEY`: Your API key
- `LLM_MODEL`: Model name (e.g., `gpt-4o`, `ollama/llama3`, etc.)
- `WEB_URL`: Must match the frontend's actual URL (default `http://localhost:3000`)

> **Important**: The `.env` file lives at the **project root**. The NestJS app reads from both `apps/api/.env` and `../../.env` (root).

### 4. Initialize Database

```bash
cd apps/api
npx prisma db push      # Sync schema to DB
npx prisma db seed      # Create dev admin user (admin@admin.com / admin)
cd ../..
```

### 5. Start Development Servers

```bash
# Start both frontend and backend
pnpm dev

# Or start individually
pnpm dev:api   # Backend on http://localhost:4000/api
pnpm dev:web   # Frontend on http://localhost:3000
```

### 6. Login

Open the frontend URL and login with:
- **Email**: `admin@admin.com`
- **Password**: `admin`

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start both frontend and backend |
| `pnpm dev:api` | Start only the backend |
| `pnpm dev:web` | Start only the frontend |
| `pnpm build` | Build all packages and applications |
| `pnpm lint` | Run linters across all packages |

### Database Commands (run from `apps/api/`)

| Command | Description |
|---------|-------------|
| `npx prisma db push` | Sync schema to database |
| `npx prisma db seed` | Seed dev admin user |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma studio` | Open Prisma Studio GUI |

## Production Deployment (Docker)

```bash
cp .env.example .env
# Edit .env with production values (strong passwords, real SMTP, etc.)
docker compose up -d --build
```

Accessible at `http://localhost` (or the port set in `APP_EXTERNAL_PORT`).

| Service | Description |
|---------|-------------|
| `postgres` | PostgreSQL 16 database |
| `redis` | Redis 7 cache & queue |
| `api` | NestJS backend (auto-migrates on start) |
| `web` | React SPA (served via nginx) |
| `nginx` | Reverse proxy (routes /api → API, / → SPA) |

## Troubleshooting

### Windows: Redis port blocked by Hyper-V

Windows Hyper-V reserves random port ranges that can block Redis (default 6379).

**Diagnose:**
```powershell
netsh interface ipv4 show excludedportrange protocol=tcp
```

**Fix:** Change Redis port in `docker-compose.dev.yml` and `.env`:
```yaml
# docker-compose.dev.yml
redis:
  ports:
    - "6500:6379"   # Map to port outside excluded range
```
```env
# .env
REDIS_PORT=6500
```

### NestJS: "Cannot find module dist/main"

The `incremental: true` TypeScript option (inherited from `tsconfig.base.json`) conflicts with NestJS watch mode. The `apps/api/tsconfig.json` overrides this to `false`.

If this still occurs:
```powershell
cd apps/api
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Force tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
pnpm dev
```

### CORS errors on login

The API's CORS origin is set from the `WEB_URL` environment variable. If Vite picks a different port (e.g., 3001 because 3000 is in use), update `.env`:
```env
WEB_URL=http://localhost:3001
```
Then restart the API.

### Prisma: "Authentication failed"

The `DATABASE_URL` in `.env` must match the Docker Compose Postgres credentials:
- Docker uses `POSTGRES_USER` / `POSTGRES_PASSWORD` (default: `user` / `pass`)
- `DATABASE_URL` format: `postgresql://user:pass@localhost:5432/interview_review`

### SMTP errors in dev

The `[MailerService] Error occurred while verifying the transporter` warning is expected in development if you don't have a real SMTP server. The app works fine without it — email features (verification, password reset) just won't send.

## Development Notes

- Files are kept under 200 lines where possible
- Backend uses NestJS modular architecture (one module per domain)
- Frontend uses React Router with nested layouts (MainLayout for users, AdminLayout for admin)
- All protected routes require JWT authentication
- Admin routes additionally require `ADMIN` role
- TypeScript strict mode is configured
- Uses conventional commits

## License

Private - All Rights Reserved
