# Quick Start: Database Setup (5 minutes)

**For developers: Get the database running locally**

---

## Step 1: Prerequisites (2 min)

```bash
# Verify PostgreSQL installed
psql --version
# Expected: psql (PostgreSQL) 13.0 or higher

# Verify Node.js installed
node --version
# Expected: v16.0 or higher
```

If not installed:
- **PostgreSQL**: [Download](https://www.postgresql.org/download/)
- **Node.js**: [Download](https://nodejs.org/)

---

## Step 2: Environment File (1 min)

Create `.env.local` in project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/interview_dev?schema=public"
NODE_ENV="development"
```

---

## Step 3: Install & Migrate (2 min)

```bash
# Install dependencies
npm install

# Create database and run migrations
npx prisma migrate dev --name init

# You'll be prompted to create the database, press Enter to confirm
```

Expected output:
```
✔ Your database has been created at localhost:5432
✔ Migration dev_init has been applied
✔ Generated Prisma Client
```

---

## Step 4: Verify (Done!)

```bash
# Open Prisma Studio to inspect database
npx prisma studio

# Opens browser at http://localhost:5555
# You should see all 15 tables with sample data
```

---

## Common Commands

```bash
# View database in web UI
npx prisma studio

# Create new migration after schema.prisma changes
npx prisma migrate dev --name <description>

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client (auto-done after migrate)
npx prisma generate

# Validate schema
npx prisma validate

# View pending migrations
npx prisma migrate status
```

---

## Troubleshooting

### "Can't reach database server"
```bash
# Start PostgreSQL
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql

# Windows
# Open Services, find PostgreSQL, click Start
```

### "role 'postgres' does not exist"
```bash
# Create default user
createuser -s postgres
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

### "database 'interview_dev' does not exist"
```bash
# Let Prisma create it
npx prisma migrate dev --name init

# Or create manually
createdb -U postgres interview_dev
```

### pgvector extension not found
```bash
# Install pgvector extension
psql -d interview_dev -U postgres -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

---

## Quick Test: Query Data

Create `test-query.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // List all roles
  const roles = await prisma.role.findMany();
  console.log('Roles:', roles);

  // List all questions
  const questions = await prisma.question.findMany();
  console.log('Questions:', questions);

  // List users
  const users = await prisma.user.findMany();
  console.log('Users:', users);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
```

Run:
```bash
node test-query.js
```

---

## Next: Start Building

1. **API Routes:** See `docs/database-query-reference.md` for query examples
2. **Testing:** See `docs/schema-validation-and-testing.md` for test setup
3. **Full Guide:** See `docs/database-setup-guide.md` for advanced topics

---

## Need Help?

- Schema questions → See `prisma/schema.prisma` (fully commented)
- Query examples → See `docs/database-query-reference.md`
- Setup issues → See `docs/database-setup-guide.md` § Troubleshooting
- Performance → See `docs/schema-validation-and-testing.md` § Load Testing
