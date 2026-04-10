# Database Setup Guide

**AI-Powered Mock Interview Platform**

---

## Prerequisites

- PostgreSQL 13+ installed and running
- Node.js 16+ with npm/yarn
- `.env.local` file with `DATABASE_URL`
- Prisma CLI: `npm install -g @prisma/cli`

---

## 1. Environment Configuration

Create `.env.local` (never commit to git):

```bash
# PostgreSQL connection
DATABASE_URL="postgresql://user:password@localhost:5432/interview_platform?schema=public"

# LLM Settings (can be updated via admin panel later)
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo"

# App Settings
NODE_ENV="development"
JWT_SECRET="your-secret-key-here"
```

### Connection String Format

```
postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]
```

**Example for local development:**
```
postgresql://postgres:postgres@localhost:5432/interview_dev?schema=public
```

**Example for cloud (Supabase, Railway, etc.):**
```
postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres?schema=public&sslmode=require
```

---

## 2. Initial Setup (First Time)

### 2.1 Install Dependencies

```bash
npm install
npm install @prisma/client
```

### 2.2 Create Database

```bash
# Using psql directly
psql -U postgres -c "CREATE DATABASE interview_platform;"

# Or let Prisma migrations handle it
npx prisma migrate deploy
```

### 2.3 Run Migrations

```bash
# Apply all pending migrations
npx prisma migrate deploy

# OR if starting fresh, reset database (DESTRUCTIVE - removes all data)
npx prisma migrate reset
```

After migration, verify schema:

```bash
npx prisma db push --skip-generate
```

### 2.4 Generate Prisma Client

```bash
npx prisma generate
```

This creates `node_modules/.prisma/client/` with type-safe client code.

### 2.5 (Optional) Seed Database with Initial Data

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create roles
  const devopsRole = await prisma.role.upsert({
    where: { name: 'DevOps Engineer' },
    update: {},
    create: {
      name: 'DevOps Engineer',
      description: 'Infrastructure and deployment specialist',
    },
  });

  const backendRole = await prisma.role.upsert({
    where: { name: 'Backend Developer' },
    update: {},
    create: {
      name: 'Backend Developer',
      description: 'Server-side application developer',
    },
  });

  // Create topics for DevOps
  const kubernetesToopic = await prisma.topic.upsert({
    where: { roleId_slug: { roleId: devopsRole.id, slug: 'kubernetes' } },
    update: {},
    create: {
      roleId: devopsRole.id,
      name: 'Kubernetes',
      slug: 'kubernetes',
      description: 'Container orchestration platform',
    },
  });

  const cicdTopic = await prisma.topic.upsert({
    where: { roleId_slug: { roleId: devopsRole.id, slug: 'ci-cd' } },
    update: {},
    create: {
      roleId: devopsRole.id,
      name: 'CI/CD',
      slug: 'ci-cd',
      description: 'Continuous integration and deployment',
    },
  });

  // Create sample questions
  await prisma.question.create({
    data: {
      topicId: kubernetesToopic.id,
      text: 'Explain how Kubernetes manages pod networking.',
      difficultyLevel: 'INTERMEDIATE',
      expectedAnswer: 'Kubernetes uses a flat network model where each pod gets a unique IP...',
    },
  });

  console.log('✓ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:

```bash
npx prisma db seed
```

Update `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

---

## 3. Development Workflow

### 3.1 Make Schema Changes

Edit `prisma/schema.prisma` with new models or fields.

### 3.2 Create Migration

```bash
npx prisma migrate dev --name <migration_name>
```

**Examples:**
```bash
npx prisma migrate dev --name add_cv_analysis_table
npx prisma migrate dev --name add_deleted_by_column
npx prisma migrate dev --name rename_question_difficulty
```

This will:
1. Analyze the diff between schema.prisma and database
2. Create a new migration file in `prisma/migrations/`
3. Apply the migration
4. Regenerate Prisma Client

### 3.3 Code Generation

Automatically done after `migrate dev`, but manually:

```bash
npx prisma generate
```

---

## 4. Production Deployment

### 4.1 Pre-Deployment Checklist

- [ ] All migrations committed to git
- [ ] `.env.local` never committed
- [ ] Test migrations on staging replica
- [ ] Backup production database
- [ ] Review migration SQL in `prisma/migrations/`

### 4.2 Deploy Migrations

```bash
# In CI/CD pipeline or manually
npx prisma migrate deploy

# Verify success
npx prisma db execute --stdin < migration_verification.sql
```

### 4.3 Create Connection Pool

For production, use PgBouncer or cloud provider pooling:

**PgBouncer Config (`pgbouncer.ini`):**
```ini
[databases]
interview_platform = host=prod-db.example.com port=5432 dbname=interview_platform user=postgres password=xxxxx

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
min_pool_size = 10
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 100
```

Update `DATABASE_URL` to use PgBouncer:
```
postgresql://postgres:xxxxx@localhost:6432/interview_platform?schema=public
```

### 4.4 Enable Monitoring

Add connection pool monitoring to Grafana/DataDog:

```sql
-- Check active connections
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE datname = 'interview_platform';

-- Check slow queries (>1s)
SELECT query, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 5. Backup & Recovery

### 5.1 Automated Backups

```bash
# Daily backup script (cron: 0 2 * * *)
#!/bin/bash
BACKUP_DIR="/backups/pg"
DB_NAME="interview_platform"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

pg_dump $DB_NAME | gzip > $BACKUP_DIR/interview_${TIMESTAMP}.sql.gz
```

### 5.2 Restore from Backup

```bash
# Full restore (WARNING: destructive)
gunzip < interview_20260410_020000.sql.gz | psql interview_platform

# Or use pg_restore for faster parallel restore
pg_restore --jobs=4 --dbname=interview_platform backup.dump
```

### 5.3 Point-in-Time Recovery

Enable continuous archiving in PostgreSQL:

```sql
-- In postgresql.conf
wal_level = replica
max_wal_senders = 3
wal_keep_size = 1GB
```

---

## 6. Soft Delete Middleware Setup

### 6.1 Initialize Prisma Client

Create `lib/prisma.ts`:

```typescript
import { createPrismaClientWithSoftDelete } from './prisma-soft-delete-middleware';

const prisma = createPrismaClientWithSoftDelete();

export default prisma;
```

### 6.2 Use in Application

```typescript
import prisma from '@/lib/prisma';

// Automatically excludes deleted records
const questions = await prisma.question.findMany({
  where: { topicId: 1 }
});

// Include deleted records if needed
const allQuestions = await prisma.question.findMany({
  where: { topicId: 1, includeDeleted: true }
});

// Soft delete
import { softDeleteRecord } from '@/lib/prisma-soft-delete-middleware';
await softDeleteRecord(prisma, 'Question', questionId, userId);
```

---

## 7. Testing

### 7.1 Test Database Setup

```bash
# Create separate test database
psql -U postgres -c "CREATE DATABASE interview_test;"

# Set in .env.test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/interview_test?schema=public"
```

### 7.2 Reset Database Before Tests

```typescript
// jest.setup.ts
import { exec } from 'child_process';

beforeAll(async () => {
  // Reset database
  await exec('npx prisma migrate reset --force', { 
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### 7.3 Run Tests

```bash
npm test
```

---

## 8. Troubleshooting

### Issue: "PrismaClientInitializationError: Can't reach database server"

**Solution:**
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Verify connection string in .env.local
echo $DATABASE_URL

# Test connection directly
psql $DATABASE_URL -c "SELECT 1"
```

### Issue: "Migration pending" error

**Solution:**
```bash
# See pending migrations
npx prisma migrate status

# Apply pending
npx prisma migrate deploy

# Or reset (WARNING: deletes data)
npx prisma migrate reset
```

### Issue: "Unique constraint violation"

**Solution:**
```bash
# Check duplicate values
SELECT email, COUNT(*) 
FROM "User" 
GROUP BY email 
HAVING COUNT(*) > 1;

# Delete duplicates or resolve manually before re-running migration
```

### Issue: Vector embedding type not recognized

**Solution:**
```bash
# Install pgvector extension
psql -d interview_platform -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Verify
psql -d interview_platform -c "SELECT extname FROM pg_extension WHERE extname = 'vector';"
```

### Issue: Soft delete not filtering

**Solution:**
```typescript
// Ensure using createPrismaClientWithSoftDelete
import { createPrismaClientWithSoftDelete } from '@/lib/prisma-soft-delete-middleware';
const prisma = createPrismaClientWithSoftDelete();

// Check extension is applied
console.log(prisma.$extends); // should show extension
```

---

## 9. Maintenance

### 9.1 Analyze Query Performance

```bash
# Run query analyzer
npx prisma db execute --stdin < analyze_queries.sql

# Generate explain plans
EXPLAIN ANALYZE SELECT ... FROM ...
```

### 9.2 Rebuild Indexes

```sql
-- Rebuild all indexes for soft-delete queries
REINDEX TABLE CONCURRENT "User";
REINDEX TABLE CONCURRENT "Question";
REINDEX TABLE CONCURRENT "InterviewMessage";
REINDEX TABLE CONCURRENT "AnswerScore";
```

### 9.3 Update Statistics

```sql
-- Improve query planner accuracy
ANALYZE "User";
ANALYZE "Question";
ANALYZE "InterviewMessage";
ANALYZE "AnswerScore";
VACUUM ANALYZE;
```

---

## 10. References

- [Prisma Migrate Documentation](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/overview)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [PgBouncer Configuration](https://pgbouncer.github.io/)
- [Vector Extension for PostgreSQL](https://github.com/pgvector/pgvector)
