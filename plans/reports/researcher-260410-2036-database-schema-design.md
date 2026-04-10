# Database Schema Research: AI-Powered Mock Interview Platform

**Report Date:** 2026-04-10  
**Context:** Prisma + PostgreSQL schema design for interview platform with LLM integration, CV analysis, and multi-round scenario support.

---

## Executive Summary

Designed a PostgreSQL schema supporting:
- User management with role-based access control
- Multi-tier question hierarchy (roles → topics → questions)
- Interview session state management (scenarios → rounds → messages)
- LLM-powered score/feedback generation per answer
- CV parsing + gap analysis as interview context
- Knowledge base for RAG-powered question generation
- Soft deletes + audit timestamps for compliance
- Optimized indexes for common query patterns

---

## Schema Design Decisions

### 1. **Core User & Auth**
- `users`: email/password + roles (admin/user)
- `userProfiles`: extended data (bio, skills, experience_years)
- Separate profile for CV data isolation

### 2. **Interview Hierarchy**
```
Role (e.g., "DevOps Engineer")
├── Topic (e.g., "Kubernetes")
│   └── Question (e.g., "Explain pod networking")
└── ScenarioTemplate (admin-defined interview flow)
    └── Round (e.g., "Round 1: Foundation Topics")
        └── (references topics + difficulty)
```

**Why**: Roles can have many topics. Questions belong to topics. Scenarios define which topics appear in which rounds with difficulty progression. Supports: "Generate Kubernetes questions for DevOps round 2" query.

### 3. **Interview Session & Chat**
- `InterviewSession`: state (PENDING/ACTIVE/COMPLETED), overall_score
- `InterviewRound`: per-round metadata (topic_id, question_count, difficulty_level)
- `InterviewMessage`: chat log (who sent, content, role: USER/ASSISTANT, feedback)
- `AnswerScore`: denormalized per-answer evaluation (0-10, feedback, strengths/weaknesses)

**Why**: Messages store the conversational flow. Separate score table enables:
- Per-answer feedback for learning
- Aggregate scoring per round
- LLM evaluation result storage

### 4. **CV Upload & Analysis**
- `CVUpload`: file metadata + extraction status
- `CVParsed`: structured extraction (skills, experience, projects as JSON)
- `CVAnalysis`: LLM gap analysis result (missing_skills, experience_gaps as JSON)

**Why**: Separates upload (file) from parsing (extraction) from analysis (gap detection). Enables querying "candidates weak in Kubernetes" for targeted questions.

### 5. **Knowledge Base**
- `KnowledgeBase`: imported markdown/docs for RAG context
- `KnowledgeBaseVector`: embeddings (for future vector search)

**Why**: System prompts + knowledge base together inform question generation. Soft delete allows deprecated docs without data loss.

### 6. **LLM Configuration**
- `LLMConfig`: centralized model settings (base_url, api_key, model, temperature)
- Used by question generation + evaluation pipeline

**Why**: Admin panel can adjust behavior without code changes. Single source of truth.

---

## Soft Deletes & Audit

Applied to: Users, Roles, Topics, Questions, ScenarioTemplates, KnowledgeBase.

Pattern:
```prisma
deletedAt DateTime?
deletedBy Int? @relation("DeletedByUser")
```

Query filter via middleware: `where: { deletedAt: null }` automatically applied to reads (except explicit `includeDeleted: true`).

Index: `CREATE INDEX idx_<model>_deleted ON <model>(id) WHERE deleted_at IS NULL`

**Why**: Complies with data retention policies. Supports audit trails. Recoverable deletes.

---

## Query Patterns Supported

1. **Generate interview questions for DevOps Engineer, round 2, focusing on Kubernetes:**
   ```sql
   SELECT q.* FROM "Question" q
   JOIN "Topic" t ON q.topic_id = t.id
   JOIN "ScenarioRoundTopic" srt ON srt.topic_id = t.id
   JOIN "ScenarioRound" sr ON sr.id = srt.round_id
   WHERE sr.scenario_id = ? AND sr.round_number = 2
   AND t.name = 'Kubernetes' AND q.difficulty_level >= ?
   AND q.deleted_at IS NULL;
   ```

2. **Identify CV gaps for role-specific questions:**
   ```sql
   SELECT ca.missing_skills, ca.experience_gaps
   FROM "CVAnalysis" ca
   WHERE ca.user_id = ? AND ca.created_at >= NOW() - INTERVAL '30 days';
   ```

3. **Score progression per round:**
   ```sql
   SELECT sr.round_number, AVG(ans.score) as avg_score
   FROM "AnswerScore" ans
   JOIN "InterviewMessage" msg ON ans.message_id = msg.id
   JOIN "InterviewRound" sr ON msg.round_id = sr.id
   WHERE sr.session_id = ?
   GROUP BY sr.round_number
   ORDER BY sr.round_number;
   ```

---

## Indexes (Performance)

```sql
-- Authentication & Lookups
CREATE INDEX idx_users_email ON "User"(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON "User"(role) WHERE deleted_at IS NULL;

-- Interview Navigation
CREATE INDEX idx_session_user_status ON "InterviewSession"(user_id, status);
CREATE INDEX idx_round_session_number ON "InterviewRound"(session_id, round_number);
CREATE INDEX idx_message_round_created ON "InterviewMessage"(round_id, created_at DESC);

-- Question/Topic Discovery
CREATE INDEX idx_question_topic_difficulty ON "Question"(topic_id, difficulty_level) 
  WHERE deleted_at IS NULL;
CREATE INDEX idx_topic_role ON "Topic"(role_id) WHERE deleted_at IS NULL;

-- CV Analysis
CREATE INDEX idx_cv_analysis_user_created ON "CVAnalysis"(user_id, created_at DESC);
CREATE INDEX idx_scenario_active ON "ScenarioTemplate"(is_active) 
  WHERE deleted_at IS NULL;
```

---

## Extensibility

1. **New Role/Topic**: Add rows to Role/Topic. No schema migration.
2. **Custom Question Difficulty Scale**: Enum in schema. Backward compatible.
3. **Additional Feedback Dimensions**: Add columns to AnswerScore (e.g., `clarity_score`, `relevance_score`).
4. **Vector Embeddings**: KnowledgeBaseVector table ready for pgvector extension.
5. **Interview Analytics**: AnswerScore table supports arbitrary feedback JSON.

---

## Unresolved Questions

1. **Vector embedding storage**: Should embeddings live in PostgreSQL (pgvector) or separate vector DB? (Assumed PostgreSQL here; separate DB reduces transaction consistency.)
2. **Message versioning**: Should rejected/edited LLM responses be versioned or just replaced? (Assumed replaced; archive separate table if needed.)
3. **CV document retention**: How long to keep PDFs? (Assumed indefinite; add `retention_days` field if purge policy required.)
4. **Real-time session updates**: WebSocket channel naming? (Not in schema; application layer concern.)
5. **Concurrent round creation**: Can multiple rounds start in same session? (Assumed no; add unique constraint if allowed.)

---

## Production Checklist

- [ ] Database backups enabled
- [ ] Connection pooling configured (PgBouncer/Supabase)
- [ ] Indexes created post-migration
- [ ] Soft delete middleware tested
- [ ] Audit logging (createdBy/updatedBy) implemented
- [ ] CSV export for compliance (user data, CV analysis)
- [ ] Read replicas for analytics queries
- [ ] Row-level security (RLS) for multi-tenant scope (if needed)

---

## Trade-offs

| Decision | Benefit | Cost |
|----------|---------|------|
| Denormalized AnswerScore | Fast per-answer queries | Schema complexity |
| Soft deletes everywhere | Audit trail + recovery | Query filtering overhead |
| JSON feedback storage | Schema flexibility | Query complexity for analytics |
| Separate CVParsed/CVAnalysis | Clear separation of concerns | Extra join overhead |
| Centralized LLMConfig | Single source of truth | No per-user/role overrides |

---

## Sources

Research based on:
- [Prisma Schema Language Best Practices](https://www.prisma.io/blog/prisma-schema-language-the-best-way-to-define-your-data)
- [Anything-LLM Production Schema](https://github.com/Mintplex-Labs/anything-llm/blob/master/server/prisma/schema.prisma) — chat, documents, workspace config patterns
- [Prisma Soft Delete Middleware](https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware/soft-delete-middleware)
- [PostgreSQL Audit Trails](https://blog.yarsalabs.com/audit-trail-in-postgresql-using-prisma/)
- [Resume/Gap Analysis LLM Patterns](https://www.ijert.org/skillsync-an-explainable-ai-framework-for-resume-evaluation-skill-gap-analysis-and-career-alignment-ijertconv14is010027)
