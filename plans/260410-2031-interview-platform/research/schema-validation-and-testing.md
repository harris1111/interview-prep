# Schema Validation & Testing Guide

**Database Schema Quality Assurance for Interview Platform**

---

## 1. Schema Validation Checklist

Run these checks before deploying any migration to production.

### 1.1 Structural Integrity

```bash
# Validate Prisma schema syntax
npx prisma validate

# Generate Prisma client and check for errors
npx prisma generate

# Dry-run migration without applying
npx prisma migrate diff --from-empty --to-schema-datamodel
```

### 1.2 Migration SQL Review

```bash
# Review generated SQL before applying
cat prisma/migrations/<migration_id>/migration.sql

# Check for unsafe operations
grep -E "DROP|ALTER.*DROP|TRUNCATE" prisma/migrations/*/migration.sql
```

### 1.3 Index Coverage

Verify all high-frequency query patterns have indexes:

```sql
-- Check missing indexes for soft-delete queries
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY tablename;

-- Show all indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Find sequential scans (slow queries not using indexes)
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE query LIKE '%SELECT%'
ORDER BY mean_time DESC
LIMIT 20;
```

### 1.4 Foreign Key Integrity

```sql
-- Check for orphaned foreign key references
SELECT constraint_name
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public';

-- Verify referential integrity
SELECT * FROM information_schema.referential_constraints;

-- Test cascade deletes work as expected
BEGIN;
DELETE FROM "Role" WHERE name = 'Test Role';
-- Should cascade to Topic, Question, ScenarioTemplate
ROLLBACK;
```

### 1.5 Data Type Validation

```sql
-- Check columns for appropriate types
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Verify timestamp fields exist for audit
SELECT table_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND column_name IN ('createdAt', 'updatedAt')
GROUP BY table_name
HAVING COUNT(*) < 2;
```

---

## 2. Query Performance Testing

### 2.1 Test Common Query Patterns

```sql
-- QUERY 1: Generate interview questions (Section 1.1 from reference guide)
EXPLAIN ANALYZE
SELECT q.id, q.text, q.difficulty_level, t.name
FROM "Question" q
JOIN "Topic" t ON q.topic_id = t.id
WHERE t.slug = 'kubernetes'
  AND q.deleted_at IS NULL
LIMIT 10;

-- Expected: Uses idx_question_topic_difficulty, <50ms

-- QUERY 2: Get active session with score progression
EXPLAIN ANALYZE
SELECT s.id, s.overall_score, COUNT(DISTINCT r.id) as rounds
FROM "InterviewSession" s
LEFT JOIN "InterviewRound" r ON s.id = r.session_id
WHERE s.user_id = 1 AND s.status = 'ACTIVE'
GROUP BY s.id, s.overall_score;

-- Expected: Uses idx_interview_session_user_status, <100ms

-- QUERY 3: CV gap analysis with topic matching
EXPLAIN ANALYZE
SELECT ca.missing_skills, t.name as topic
FROM "CVAnalysis" ca
JOIN "Topic" t ON ca.target_role_id = t.role_id
WHERE ca.user_id = 1
ORDER BY ca.analyzed_at DESC;

-- Expected: Uses idx_cv_analysis_user_created, <50ms

-- QUERY 4: Chat history retrieval (pagination)
EXPLAIN ANALYZE
SELECT id, content, role, created_at
FROM "InterviewMessage"
WHERE round_id = 1
ORDER BY created_at DESC
LIMIT 50;

-- Expected: Uses idx_interview_message_round_created, <30ms
```

### 2.2 Benchmark Suite

Create `tests/schema-performance.test.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient();

describe('Schema Performance Benchmarks', () => {
  let userId: number;
  let scenarioId: number;

  beforeAll(async () => {
    // Setup test data
    const user = await prisma.user.create({
      data: { email: 'test@example.com', passwordHash: 'hash' },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.$executeRaw`TRUNCATE "User" CASCADE`;
    await prisma.$disconnect();
  });

  test('Question generation query (target: <50ms)', async () => {
    const start = performance.now();
    
    await prisma.question.findMany({
      where: {
        topic: { slug: 'kubernetes', deletedAt: null },
        deletedAt: null,
      },
      take: 10,
    });

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
    console.log(`✓ Question query: ${duration.toFixed(2)}ms`);
  });

  test('Session score aggregation (target: <100ms)', async () => {
    const start = performance.now();

    await prisma.interviewSession.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: {
        rounds: {
          include: {
            scores: true,
          },
        },
      },
    });

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
    console.log(`✓ Session query: ${duration.toFixed(2)}ms`);
  });

  test('Chat history retrieval (target: <30ms)', async () => {
    const start = performance.now();

    await prisma.interviewMessage.findMany({
      where: { sessionId: 1 },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(30);
    console.log(`✓ Chat history query: ${duration.toFixed(2)}ms`);
  });

  test('Bulk insert (100 questions: target: <500ms)', async () => {
    const topicId = 1;
    const questions = Array.from({ length: 100 }, (_, i) => ({
      topicId,
      text: `Test question ${i}`,
      difficultyLevel: 'INTERMEDIATE' as const,
    }));

    const start = performance.now();
    
    await prisma.question.createMany({
      data: questions,
      skipDuplicates: true,
    });

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500);
    console.log(`✓ Bulk insert: ${duration.toFixed(2)}ms`);
  });
});
```

Run: `npm test -- schema-performance.test.ts`

---

## 3. Data Integrity Tests

### 3.1 Foreign Key Cascade Tests

```typescript
describe('Cascade Delete Behavior', () => {
  test('Deleting Role cascades to Topics and Questions', async () => {
    // Create role → topic → question chain
    const role = await prisma.role.create({
      data: { name: 'Test Role' },
    });

    const topic = await prisma.topic.create({
      data: { roleId: role.id, name: 'Test Topic', slug: 'test' },
    });

    const question = await prisma.question.create({
      data: { topicId: topic.id, text: 'Test Q', difficultyLevel: 'BEGINNER' },
    });

    // Delete role
    await prisma.role.delete({ where: { id: role.id } });

    // Verify cascade
    const topicExists = await prisma.topic.findFirst({
      where: { id: topic.id, includeDeleted: true },
    });
    expect(topicExists).toBeNull();

    const questionExists = await prisma.question.findFirst({
      where: { id: question.id, includeDeleted: true },
    });
    expect(questionExists).toBeNull();
  });

  test('Deleting User cascades to related records', async () => {
    const user = await prisma.user.create({
      data: { email: 'cascade@test.com', passwordHash: 'hash' },
    });

    const session = await prisma.interviewSession.create({
      data: {
        userId: user.id,
        scenarioId: 1,
        status: 'ACTIVE',
      },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const sessionExists = await prisma.interviewSession.findFirst({
      where: { id: session.id },
    });
    expect(sessionExists).toBeNull();
  });
});
```

### 3.2 Soft Delete Behavior Tests

```typescript
describe('Soft Delete Behavior', () => {
  test('Soft-deleted records excluded by default', async () => {
    const topic = await prisma.topic.create({
      data: { roleId: 1, name: 'Soft Delete Test', slug: 'soft-delete-test' },
    });

    // Soft delete
    await prisma.topic.update({
      where: { id: topic.id },
      data: { deletedAt: new Date() },
    });

    // Should not appear in normal queries
    const found = await prisma.topic.findFirst({
      where: { id: topic.id },
    });
    expect(found).toBeNull();

    // Should appear with includeDeleted flag
    const foundWithDeleted = await prisma.topic.findFirst({
      where: { id: topic.id, includeDeleted: true },
    });
    expect(foundWithDeleted).not.toBeNull();
    expect(foundWithDeleted?.deletedAt).not.toBeNull();
  });

  test('Soft delete records audit trail', async () => {
    const adminUser = await prisma.user.create({
      data: { email: 'admin@test.com', passwordHash: 'hash', role: 'ADMIN' },
    });

    const topic = await prisma.topic.create({
      data: { roleId: 1, name: 'Audit Test', slug: 'audit-test' },
    });

    // Soft delete with tracking
    await prisma.topic.update({
      where: { id: topic.id },
      data: { deletedAt: new Date(), deletedBy: adminUser.id },
    });

    // Verify audit trail
    const deleted = await prisma.topic.findFirst({
      where: { id: topic.id, includeDeleted: true },
      include: { deletedByRelation: true },
    });

    expect(deleted?.deletedBy).toBe(adminUser.id);
    expect(deleted?.deletedByRelation?.email).toBe('admin@test.com');
  });
});
```

### 3.3 Unique Constraint Tests

```typescript
describe('Unique Constraints', () => {
  test('Email uniqueness enforced', async () => {
    const email = 'duplicate@test.com';

    await prisma.user.create({
      data: { email, passwordHash: 'hash1' },
    });

    expect(async () => {
      await prisma.user.create({
        data: { email, passwordHash: 'hash2' },
      });
    }).rejects.toThrow('Unique constraint failed');
  });

  test('Role-Topic slug uniqueness', async () => {
    const roleId = 1;
    const slug = 'unique-slug';

    await prisma.topic.create({
      data: { roleId, name: 'Topic 1', slug },
    });

    expect(async () => {
      await prisma.topic.create({
        data: { roleId, name: 'Topic 2', slug },
      });
    }).rejects.toThrow('Unique constraint failed');
  });

  test('ScenarioRound-roundNumber uniqueness within scenario', async () => {
    const scenarioId = 1;

    await prisma.scenarioRound.create({
      data: { scenarioId, roundNumber: 1 },
    });

    expect(async () => {
      await prisma.scenarioRound.create({
        data: { scenarioId, roundNumber: 1 },
      });
    }).rejects.toThrow('Unique constraint failed');
  });
});
```

---

## 4. Load Testing

### 4.1 Concurrent User Simulation

```typescript
import { performance } from 'perf_hooks';

describe('Load Testing', () => {
  test('Handle 100 concurrent session queries', async () => {
    const promises: Promise<any>[] = [];

    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      promises.push(
        prisma.interviewSession.findMany({
          where: { status: 'ACTIVE' },
          take: 10,
        })
      );
    }

    await Promise.all(promises);
    const duration = performance.now() - start;

    console.log(`✓ 100 concurrent queries: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(5000); // Should complete in <5s
  });

  test('Handle 50 concurrent message inserts', async () => {
    const roundId = 1;
    const promises: Promise<any>[] = [];

    const start = performance.now();

    for (let i = 0; i < 50; i++) {
      promises.push(
        prisma.interviewMessage.create({
          data: {
            sessionId: 1,
            roundId,
            role: 'USER',
            content: `Message ${i}`,
          },
        })
      );
    }

    await Promise.all(promises);
    const duration = performance.now() - start;

    console.log(`✓ 50 concurrent inserts: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(2000);
  });
});
```

### 4.2 Connection Pool Saturation Test

```bash
#!/bin/bash
# Load test with pgbench

pgbench -i -U postgres interview_platform

# Simulate 10 clients with 1000 transactions each
pgbench -c 10 -j 4 -t 1000 -U postgres interview_platform

# Monitor connection pool
psql -d interview_platform -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 5. Migration Safety Tests

### 5.1 Pre-Migration Validation

```bash
#!/bin/bash
# Before deploying migration

# 1. Check for unsafe operations
echo "Checking for unsafe SQL operations..."
grep -E "DROP|TRUNCATE" prisma/migrations/*/migration.sql && exit 1

# 2. Validate schema syntax
echo "Validating Prisma schema..."
npx prisma validate || exit 1

# 3. Test on staging
echo "Testing migration on staging environment..."
DATABASE_URL=$STAGING_DB_URL npx prisma migrate deploy || exit 1

# 4. Run integration tests
echo "Running integration tests..."
npm test -- --testPathPattern=integration || exit 1

echo "✓ All pre-migration checks passed"
```

### 5.2 Post-Migration Validation

```sql
-- After migration deployed to production

-- Verify schema changes applied
SELECT COUNT(*) FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'new_column_name';

-- Check index creation
SELECT indexname FROM pg_indexes
WHERE tablename = 'new_table_name';

-- Verify no data loss
SELECT COUNT(*) FROM "InterviewSession";
SELECT COUNT(*) FROM "Question";

-- Check for deadlocks during migration
SELECT * FROM pg_stat_activity WHERE wait_event_type = 'Lock';
```

---

## 6. Schema Monitoring Queries

### 6.1 Table Size Analysis

```sql
-- Find largest tables
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 6.2 Index Usage Statistics

```sql
-- Unused indexes (potential cleanup)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Most used indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;
```

### 6.3 Table Bloat Detection

```sql
-- Detect tables needing VACUUM
SELECT 
  schemaname,
  tablename,
  ROUND(100 * (pg_total_relation_size(schemaname||'.'||tablename) - 
    pg_relation_size(schemaname||'.'||tablename)) / 
    pg_total_relation_size(schemaname||'.'||tablename)) as bloat_ratio
FROM pg_tables
WHERE schemaname = 'public'
HAVING ROUND(100 * (pg_total_relation_size(schemaname||'.'||tablename) - 
  pg_relation_size(schemaname||'.'||tablename)) / 
  pg_total_relation_size(schemaname||'.'||tablename)) > 20
ORDER BY bloat_ratio DESC;
```

---

## 7. Continuous Integration Setup

### 7.1 GitHub Actions Workflow

Create `.github/workflows/schema-validation.yml`:

```yaml
name: Schema Validation & Testing

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: interview_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install
      
      - name: Validate Prisma Schema
        run: npx prisma validate
      
      - name: Run Migrations
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/interview_test
        run: npx prisma migrate deploy
      
      - name: Run Schema Tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/interview_test
        run: npm test -- schema-validation-and-testing
      
      - name: Check Performance Benchmarks
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/interview_test
        run: npm test -- schema-performance.test.ts
```

---

## 8. Checklist for Release

- [ ] All migrations reviewed and tested
- [ ] Schema changes documented
- [ ] Performance benchmarks run and passed
- [ ] Data integrity tests passed
- [ ] Backup created pre-deployment
- [ ] Soft delete behavior verified
- [ ] Index coverage validated
- [ ] Load testing completed
- [ ] Rollback plan documented
- [ ] Post-deployment monitoring configured
