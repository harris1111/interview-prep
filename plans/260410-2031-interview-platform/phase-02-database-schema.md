# Phase 2: Database Schema & Prisma

## Overview
- **Priority**: P1 (Blocks phases 3-8)
- **Status**: Pending
- **Effort**: 4h
- Design and implement full Prisma schema for interview platform.

## Key Insights
- Questions can be admin-created (fixed) or LLM-generated (dynamic)
- Scenario templates are reusable; interview sessions are instances
- CV analysis stores both raw text and structured JSON extraction
- Knowledge base entries are imported markdown chunks for RAG context
- LLM config is a singleton settings table (admin-managed)

## Requirements

### Functional
- Support full CRUD for all entities
- Cascade deletes where appropriate (session → rounds → messages)
- Soft delete for questions and scenarios (preserve history)
- Full-text search on questions and knowledge base

### Non-Functional
- Indexes on frequently queried columns
- JSON columns for flexible LLM outputs (scores, analysis)
- Enum types for status, difficulty, role

## Architecture — Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ─────────────────────────────────────────

enum UserRole {
  ADMIN
  USER
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
  EXPERT
}

enum SessionStatus {
  DRAFT
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

enum RoundStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

enum MessageRole {
  SYSTEM
  ASSISTANT
  USER
}

enum CvAnalysisStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

// ─── USERS ─────────────────────────────────────────

model User {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String
  name            String
  role            UserRole  @default(USER)
  isVerified      Boolean   @default(false)
  verifyToken     String?
  resetToken      String?
  resetTokenExp   DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  sessions        InterviewSession[]
  cvUploads       CvUpload[]

  @@index([email])
}

// ─── CAREER & TOPICS ───────────────────────────────

model Career {
  id          String   @id @default(uuid())
  name        String   @unique  // "DevOps Engineer", "Backend Developer"
  slug        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  topics    Topic[]
  scenarios ScenarioTemplate[]
}

model Topic {
  id          String   @id @default(uuid())
  name        String   // "Kubernetes", "CI/CD", "System Design"
  slug        String
  careerId    String
  description String?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  career    Career     @relation(fields: [careerId], references: [id], onDelete: Cascade)
  questions Question[]
  roundTopics RoundTemplateTopic[]

  @@unique([careerId, slug])
  @@index([careerId])
}

// ─── QUESTIONS ─────────────────────────────────────

model Question {
  id            String     @id @default(uuid())
  topicId       String
  content       String     // The question text
  expectedAnswer String?   // Reference answer (for scoring context)
  difficulty    Difficulty @default(MEDIUM)
  isFixed       Boolean    @default(true)  // admin-created vs LLM-generated
  isActive      Boolean    @default(true)  // soft delete
  tags          String[]   // ["networking", "troubleshooting"]
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  topic Topic @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@index([topicId])
  @@index([difficulty])
  @@index([isActive])
}

// ─── SCENARIO TEMPLATES ────────────────────────────

model ScenarioTemplate {
  id          String   @id @default(uuid())
  name        String   // "5-Round DevOps Deep Dive"
  careerId    String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  career Career              @relation(fields: [careerId], references: [id], onDelete: Cascade)
  rounds RoundTemplate[]
  sessions InterviewSession[]

  @@index([careerId])
}

model RoundTemplate {
  id              String @id @default(uuid())
  scenarioId      String
  roundNumber     Int
  name            String           // "CI/CD & GitHub Actions Deep Dive"
  description     String?
  durationMinutes Int    @default(30)
  questionCount   Int    @default(5)
  difficulty      Difficulty @default(MEDIUM)

  scenario ScenarioTemplate     @relation(fields: [scenarioId], references: [id], onDelete: Cascade)
  topics   RoundTemplateTopic[]

  @@unique([scenarioId, roundNumber])
  @@index([scenarioId])
}

model RoundTemplateTopic {
  id            String @id @default(uuid())
  roundId       String
  topicId       String
  weight        Int    @default(1)  // relative weight for question distribution

  round RoundTemplate @relation(fields: [roundId], references: [id], onDelete: Cascade)
  topic Topic         @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@unique([roundId, topicId])
}

// ─── INTERVIEW SESSIONS ────────────────────────────

model InterviewSession {
  id              String        @id @default(uuid())
  userId          String
  scenarioId      String
  status          SessionStatus @default(DRAFT)
  overallScore    Float?        // 0-10
  overallFeedback Json?         // { strengths: [], weaknesses: [], summary: "" }
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user     User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  scenario ScenarioTemplate @relation(fields: [scenarioId], references: [id])
  rounds   InterviewRound[]

  @@index([userId])
  @@index([status])
}

model InterviewRound {
  id            String      @id @default(uuid())
  sessionId     String
  roundNumber   Int
  topicFocus    String      // topic name for display
  status        RoundStatus @default(PENDING)
  score         Float?      // 0-10 average
  feedback      Json?       // { summary: "", strengths: [], improvements: [] }
  startedAt     DateTime?
  completedAt   DateTime?

  session  InterviewSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  messages InterviewMessage[]

  @@unique([sessionId, roundNumber])
  @@index([sessionId])
}

model InterviewMessage {
  id          String      @id @default(uuid())
  roundId     String
  role        MessageRole
  content     String      // message text
  score       Float?      // per-answer score (0-10), null for non-user messages
  feedback    String?     // per-answer feedback from LLM
  metadata    Json?       // { questionRef: "q-uuid", tokensUsed: 150 }
  createdAt   DateTime    @default(now())

  round InterviewRound @relation(fields: [roundId], references: [id], onDelete: Cascade)

  @@index([roundId])
  @@index([createdAt])
}

// ─── CV MANAGEMENT ─────────────────────────────────

model CvUpload {
  id           String           @id @default(uuid())
  userId       String
  fileName     String
  filePath     String           // stored file path
  rawText      String?          // extracted PDF text
  createdAt    DateTime         @default(now())

  user     User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  analysis CvAnalysis?

  @@index([userId])
}

model CvAnalysis {
  id             String           @id @default(uuid())
  cvUploadId     String           @unique
  status         CvAnalysisStatus @default(PENDING)
  structuredData Json?            // { skills: [], experience: [], projects: [], education: [] }
  gapReport      Json?            // { gaps: [], strengths: [], recommendations: [] }
  targetCareerId String?          // which career this was analyzed against
  error          String?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  cvUpload CvUpload @relation(fields: [cvUploadId], references: [id], onDelete: Cascade)
}

// ─── KNOWLEDGE BASE ────────────────────────────────

model KnowledgeEntry {
  id        String   @id @default(uuid())
  title     String
  content   String   // markdown content
  source    String?  // original file path
  careerId  String?  // null = general knowledge
  topicSlug String?  // loose reference to topic
  tags      String[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([careerId])
  @@index([tags])
}

// ─── APP SETTINGS ──────────────────────────────────

model AppSettings {
  id         String @id @default("singleton")
  llmBaseUrl String @default("https://api.openai.com/v1")
  llmApiKey  String @default("")
  llmModel   String @default("gpt-4o")
  llmTemperature Float @default(0.7)
  systemPrompt   String? // global system prompt prefix
  updatedAt  DateTime @updatedAt
}
```

## Related Code Files
- **Create**: `apps/api/prisma/schema.prisma`
- **Create**: `apps/api/prisma/seed.ts` — seed admin user, default career/topics, app settings
- **Create**: `apps/api/src/modules/prisma/prisma.module.ts`
- **Create**: `apps/api/src/modules/prisma/prisma.service.ts`

## Implementation Steps

1. Write Prisma schema as designed above
2. Create PrismaModule (global NestJS module wrapping PrismaService)
3. Run initial migration: `prisma migrate dev --name init`
4. Create seed script:
   - Admin user (email from env, hashed password)
   - "DevOps Engineer" career with topics: Kubernetes, CI/CD, Docker, Linux, Terraform/IaC, Cloud (GCP/AWS), Monitoring, Networking, Security, Git, System Design, Behavioral
   - Default AppSettings singleton
5. Test seed: `prisma db seed`

## Todo List
- [ ] Write Prisma schema
- [ ] Create PrismaModule + PrismaService
- [ ] Run initial migration
- [ ] Write seed script (admin + DevOps career + topics)
- [ ] Verify all relations and indexes
- [ ] Test CRUD operations via Prisma Studio

## Success Criteria
- `prisma migrate dev` runs cleanly
- `prisma db seed` creates admin user + DevOps career + 12 topics + settings
- `prisma studio` shows all tables with correct relations
- No orphaned records possible (cascade deletes)

## Risk Assessment
- **JSON columns**: flexible but no type safety at DB level — validate in app layer
- **Knowledge base search**: PostgreSQL full-text search sufficient for this scale; no need for vector DB yet

## Next Steps
- Phase 3: Authentication (uses User model)
