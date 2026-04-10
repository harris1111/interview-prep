# Database Query Reference Guide

**Interview Platform - Common Query Patterns**

---

## 1. Question Generation Pipeline

### 1.1 Generate Interview Questions for CV Gap Analysis

**Use Case:** User uploaded CV for DevOps Engineer role. Generate Kubernetes questions for round 2 focusing on candidate's weak areas.

```sql
-- Get missing skills and experience gaps from latest CV analysis
SELECT 
  ca.missing_skills,
  ca.experience_gaps,
  ca.overall_fit
FROM "CVAnalysis" ca
WHERE ca.user_id = $1 
  AND ca.target_role_id = (
    SELECT id FROM "Role" WHERE name = 'DevOps Engineer'
  )
ORDER BY ca.analyzed_at DESC
LIMIT 1;

-- Get questions for target topics/round with difficulty progression
SELECT 
  q.id,
  q.text,
  q.difficulty_level,
  t.name as topic_name,
  t.slug as topic_slug
FROM "Question" q
JOIN "Topic" t ON q.topic_id = t.id
JOIN "ScenarioRoundTopic" srt ON srt.topic_id = t.id
JOIN "ScenarioRound" sr ON sr.id = srt.round_id
WHERE sr.scenario_id = $2 
  AND sr.round_number = 2
  AND t.slug = 'kubernetes'
  AND q.difficulty_level IN ('INTERMEDIATE', 'ADVANCED')
  AND q.deleted_at IS NULL
ORDER BY RANDOM()
LIMIT srt.question_count;
```

### 1.2 Load LLM Configuration for Question Generation

```sql
SELECT 
  generation_model,
  generation_api_key,
  generation_temp,
  question_gen_prompt,
  max_context_chunks,
  use_knowledge_base
FROM "LLMConfig"
LIMIT 1;

-- If using knowledge base context for RAG:
SELECT 
  kb.id,
  kb.title,
  kbv.embedding,
  kbv.chunk
FROM "KnowledgeBase" kb
JOIN "KnowledgeBaseVector" kbv ON kb.id = kbv.kb_id
WHERE kb.category = 'kubernetes' 
  AND kb.is_active = TRUE
  AND kb.deleted_at IS NULL
  AND 1 - (kbv.embedding <=> (SELECT embedding FROM "KnowledgeBaseVector" LIMIT 1))
ORDER BY 1 - (kbv.embedding <=> (SELECT embedding FROM "KnowledgeBaseVector" LIMIT 1)) DESC
LIMIT 5; -- max_context_chunks
```

---

## 2. Interview Session Management

### 2.1 Create New Interview Session

```sql
INSERT INTO "InterviewSession" 
  (user_id, scenario_id, status, started_at)
VALUES 
  ($1, $2, 'ACTIVE', NOW())
RETURNING id, user_id, scenario_id, status;

-- Create initial rounds based on scenario template
INSERT INTO "InterviewRound" 
  (session_id, round_number, topic_id)
SELECT 
  $1 as session_id,
  sr.round_number,
  srt.topic_id
FROM "ScenarioRound" sr
LEFT JOIN "ScenarioRoundTopic" srt ON sr.id = srt.round_id
WHERE sr.scenario_id = $2
ORDER BY sr.round_number;
```

### 2.2 Get Active Interview Session with History

```sql
SELECT 
  s.id,
  s.user_id,
  s.scenario_id,
  s.status,
  s.overall_score,
  s.started_at,
  s.completed_at,
  COUNT(DISTINCT r.id) as total_rounds,
  COUNT(DISTINCT m.id) as total_messages,
  AVG(ans.score) as avg_score_so_far
FROM "InterviewSession" s
LEFT JOIN "InterviewRound" r ON s.id = r.session_id
LEFT JOIN "InterviewMessage" m ON r.id = m.round_id
LEFT JOIN "AnswerScore" ans ON ans.round_id = r.id
WHERE s.user_id = $1 AND s.status IN ('ACTIVE', 'PAUSED')
GROUP BY s.id, s.user_id, s.scenario_id, s.status, s.overall_score, s.started_at, s.completed_at;
```

### 2.3 Store Chat Message (Question or Answer)

```sql
-- Store user's answer
INSERT INTO "InterviewMessage" 
  (session_id, round_id, question_id, role, content)
VALUES 
  ($1, $2, $3, 'USER', $4)
RETURNING id, created_at;

-- Store LLM's question
INSERT INTO "InterviewMessage" 
  (session_id, round_id, question_id, role, content)
VALUES 
  ($1, $2, $3, 'ASSISTANT', $4)
RETURNING id, created_at;
```

### 2.4 Score an Answer and Store Feedback

```sql
INSERT INTO "AnswerScore" 
  (message_id, question_id, round_id, score, feedback, strengths, weaknesses)
VALUES 
  ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, score, feedback;

-- Update round score (average of all answers in round)
UPDATE "InterviewRound" 
SET round_score = (
  SELECT AVG(score) 
  FROM "AnswerScore" 
  WHERE round_id = $1
)
WHERE id = $1;
```

### 2.5 Complete Interview Session with Overall Score

```sql
UPDATE "InterviewSession" 
SET 
  status = 'COMPLETED',
  completed_at = NOW(),
  overall_score = (
    SELECT AVG(score) 
    FROM "AnswerScore" 
    WHERE round_id IN (
      SELECT id FROM "InterviewRound" 
      WHERE session_id = $1
    )
  ),
  strengths = $2,
  weaknesses = $3,
  feedback = $4
WHERE id = $1
RETURNING id, overall_score, status, completed_at;
```

---

## 3. Analytics & Reporting

### 3.1 Score Progression by Round

```sql
SELECT 
  ir.round_number,
  t.name as topic_name,
  COUNT(ans.id) as answers_count,
  AVG(ans.score) as avg_score,
  MIN(ans.score) as min_score,
  MAX(ans.score) as max_score,
  STDDEV(ans.score) as score_stddev
FROM "InterviewRound" ir
LEFT JOIN "Topic" t ON ir.topic_id = t.id
LEFT JOIN "AnswerScore" ans ON ir.id = ans.round_id
WHERE ir.session_id = $1
GROUP BY ir.round_number, t.name, ir.id
ORDER BY ir.round_number;
```

### 3.2 Strength/Weakness Analysis

```sql
-- Aggregate strengths across all answers
SELECT 
  strength,
  COUNT(*) as frequency
FROM "AnswerScore",
LATERAL UNNEST(strengths) as strength
WHERE round_id IN (
  SELECT id FROM "InterviewRound" 
  WHERE session_id = $1
)
GROUP BY strength
ORDER BY frequency DESC;

-- Aggregate weaknesses
SELECT 
  weakness,
  COUNT(*) as frequency
FROM "AnswerScore",
LATERAL UNNEST(weaknesses) as weakness
WHERE round_id IN (
  SELECT id FROM "InterviewRound" 
  WHERE session_id = $1
)
GROUP BY weakness
ORDER BY frequency DESC;
```

### 3.3 User Performance Over Multiple Sessions

```sql
SELECT 
  s.id as session_id,
  s.scenario_id,
  st.name as scenario_name,
  s.overall_score,
  s.completed_at,
  EXTRACT(EPOCH FROM (s.completed_at - s.started_at)) / 60 as duration_minutes
FROM "InterviewSession" s
JOIN "ScenarioTemplate" st ON s.scenario_id = st.id
WHERE s.user_id = $1 
  AND s.status = 'COMPLETED'
ORDER BY s.completed_at DESC;
```

### 3.4 Question Difficulty Distribution & Performance

```sql
SELECT 
  q.difficulty_level,
  COUNT(q.id) as total_questions,
  COUNT(ans.id) as times_asked,
  AVG(ans.score) as avg_score,
  COUNT(CASE WHEN ans.score >= 7 THEN 1 END)::FLOAT / 
    NULLIF(COUNT(ans.id), 0) as pass_rate
FROM "Question" q
LEFT JOIN "AnswerScore" ans ON q.id = ans.question_id
WHERE q.topic_id IN (
  SELECT id FROM "Topic" 
  WHERE role_id = (SELECT id FROM "Role" WHERE name = 'DevOps Engineer')
)
AND q.deleted_at IS NULL
GROUP BY q.difficulty_level
ORDER BY q.difficulty_level;
```

---

## 4. CV Analysis & Matching

### 4.1 Get Latest CV Extraction for User

```sql
SELECT 
  cp.name,
  cp.email,
  cp.phone,
  cp.skills,
  cp.experience,
  cp.education,
  cp.certifications
FROM "CVParsed" cp
JOIN "CVUpload" cu ON cp.cv_upload_id = cu.id
WHERE cu.user_id = $1 
  AND cu.status = 'EXTRACTED'
ORDER BY cu.created_at DESC
LIMIT 1;
```

### 4.2 Get CV Gap Analysis for Interview Preparation

```sql
SELECT 
  ca.missing_skills,
  ca.experience_gaps,
  ca.strength_areas,
  ca.recommendations,
  ca.overall_fit,
  r.name as target_role
FROM "CVAnalysis" ca
JOIN "Role" r ON ca.target_role_id = r.id
WHERE ca.user_id = $1 
  AND ca.target_role_id = $2
ORDER BY ca.analyzed_at DESC
LIMIT 1;
```

### 4.3 Identify Users with Specific Skill Gaps for Targeting Questions

```sql
-- Find all users lacking "Kubernetes" for DevOps Engineer role
SELECT DISTINCT
  u.id,
  u.email,
  ca.missing_skills,
  ca.overall_fit
FROM "User" u
JOIN "CVAnalysis" ca ON u.id = ca.user_id
WHERE ca.target_role_id = (
  SELECT id FROM "Role" WHERE name = 'DevOps Engineer'
)
AND 'Kubernetes' = ANY(ca.missing_skills)
AND ca.analyzed_at >= NOW() - INTERVAL '90 days'
ORDER BY ca.overall_fit ASC;
```

---

## 5. Admin & Configuration

### 5.1 List All Roles with Question Count

```sql
SELECT 
  r.id,
  r.name,
  r.description,
  COUNT(DISTINCT t.id) as topic_count,
  COUNT(DISTINCT q.id) as question_count,
  COUNT(DISTINCT st.id) as scenario_count
FROM "Role" r
LEFT JOIN "Topic" t ON r.id = t.role_id AND t.deleted_at IS NULL
LEFT JOIN "Question" q ON t.id = q.topic_id AND q.deleted_at IS NULL
LEFT JOIN "ScenarioTemplate" st ON r.id = st.role_id AND st.deleted_at IS NULL
WHERE r.deleted_at IS NULL
GROUP BY r.id, r.name, r.description
ORDER BY topic_count DESC;
```

### 5.2 Get Scenario Template with Full Structure

```sql
SELECT 
  st.id,
  st.name,
  st.description,
  r.name as role_name,
  sr.round_number,
  sr.name as round_name,
  sr.duration,
  sr.overall_difficulty,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'topic_id', t.id,
      'topic_name', t.name,
      'question_count', srt.question_count
    )
  ) as topics
FROM "ScenarioTemplate" st
JOIN "Role" r ON st.role_id = r.id
LEFT JOIN "ScenarioRound" sr ON st.id = sr.scenario_id
LEFT JOIN "ScenarioRoundTopic" srt ON sr.id = srt.round_id
LEFT JOIN "Topic" t ON srt.topic_id = t.id
WHERE st.id = $1 AND st.deleted_at IS NULL
GROUP BY st.id, st.name, st.description, r.name, sr.round_number, sr.name, sr.duration, sr.overall_difficulty
ORDER BY sr.round_number;
```

### 5.3 Create/Update LLM Configuration

```sql
INSERT INTO "LLMConfig" 
  (generation_model, generation_api_key, generation_temp, evaluation_model, 
   evaluation_api_key, evaluation_temp, use_knowledge_base)
VALUES 
  ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (generation_model) DO UPDATE SET
  generation_api_key = EXCLUDED.generation_api_key,
  generation_temp = EXCLUDED.generation_temp,
  evaluation_model = EXCLUDED.evaluation_model,
  evaluation_api_key = EXCLUDED.evaluation_api_key,
  evaluation_temp = EXCLUDED.evaluation_temp,
  use_knowledge_base = EXCLUDED.use_knowledge_base,
  updated_at = NOW()
RETURNING *;
```

---

## 6. Soft Delete Operations

### 6.1 Soft Delete a Question

```sql
UPDATE "Question" 
SET deleted_at = NOW(), deleted_by = $1
WHERE id = $2 AND deleted_at IS NULL
RETURNING id, text, deleted_at;
```

### 6.2 Recover (Undelete) a Question

```sql
UPDATE "Question" 
SET deleted_at = NULL, deleted_by = NULL
WHERE id = $1 AND deleted_at IS NOT NULL
RETURNING id, text, deleted_at;
```

### 6.3 List Deleted Items (Audit Trail)

```sql
SELECT 
  'Question' as entity_type,
  q.id,
  q.text,
  q.deleted_at,
  u.email as deleted_by_email
FROM "Question" q
LEFT JOIN "User" u ON q.deleted_by = u.id
WHERE q.deleted_at IS NOT NULL
UNION ALL
SELECT 
  'Topic' as entity_type,
  t.id,
  t.name,
  t.deleted_at,
  u.email
FROM "Topic" t
LEFT JOIN "User" u ON t.deleted_by = u.id
WHERE t.deleted_at IS NOT NULL
ORDER BY deleted_at DESC
LIMIT 100;
```

---

## 7. Performance Tips

### Index Usage
All indexes are created automatically via Prisma migrations. Key indexes:

```
- idx_users_email: For user authentication lookups
- idx_interview_session_user_status: For finding active sessions
- idx_question_topic_difficulty: For question filtering in generation
- idx_cv_analysis_user_created: For CV gap analysis queries
- idx_interview_message_round_created: For chat history retrieval
- idx_knowledge_base_vector_embedding: For vector similarity search
```

### Query Optimization
1. **Always filter `deleted_at IS NULL`** for soft-deleted tables
2. **Use LIMIT** for pagination in large result sets
3. **Aggregate at database level** (AVG, COUNT) not in application
4. **Vector search**: Use pgvector's IVFFlat index for >100k embeddings

### Connection Pooling
Use PgBouncer or Supabase connection pooling:
- Mode: `transaction` for Prisma (switches connection per query)
- Pool size: 10-20 per environment
- Max overflow: 5-10

---

## 8. Unresolved Considerations

- **Large-scale analytics**: Partition `InterviewMessage` and `AnswerScore` by date for >1M records
- **Vector search latency**: Consider separate vector DB (Pinecone/Weaviate) if embeddings >10M
- **Data retention**: Set up archival for sessions >1 year old
- **Concurrent round updates**: Add advisory locks if allowing parallel round progression
