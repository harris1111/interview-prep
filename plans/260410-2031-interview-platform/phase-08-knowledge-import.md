# Phase 8: Knowledge Base & Import

## Overview
- **Priority**: P2 (Enriches question quality)
- **Status**: Pending
- **Effort**: 3h
- Bulk import markdown reference files into knowledge base. Admin can manage entries. Used as RAG context for LLM question generation.

## Key Insights
- Reference data at `E:\backup-mac\...\plans\reports\` contains:
  - Question banks (`devops-interview-questions-bank.md`) — parse Q/A pairs
  - Study guides (`study-01-kubernetes-deep-dive.md`) — import as knowledge chunks
  - Scenario simulations (`interview-5-round-simulation-orange-logic.md`) — import as scenario reference
  - CV materials — skip (user-specific)
- Import strategy: parse markdown files, chunk into logical sections, store in KnowledgeEntry
- Question bank files can be parsed to auto-create Question records (bonus)
- Knowledge entries used in prompt context when generating interview questions

## Requirements

### Functional
- Admin: bulk import from directory path or file upload
- Auto-detect file type: question bank → parse Q/A → create Questions; study guide → create KnowledgeEntry
- Admin: CRUD individual knowledge entries
- Admin: tag entries with career/topic for targeted retrieval
- Interview engine: retrieve relevant knowledge entries by topic for prompt context

### Non-Functional
- Parse large markdown files (some are 500+ lines)
- Chunk by H2/H3 headings for manageable context pieces
- Max 2000 chars per knowledge entry chunk

## Architecture

### Import Pipeline

```
Admin selects directory/files
       │
       ▼
POST /admin/knowledge/import  { path or files }
       │
       ├── Scan markdown files
       ├── For each file:
       │   ├── Detect type (question bank vs study guide)
       │   ├── If question bank:
       │   │   ├── Parse **Q:** / **A:** patterns
       │   │   ├── Map to career/topic by file path or content
       │   │   └── Create Question records
       │   └── If study guide / other:
       │       ├── Split by H2/H3 headings
       │       ├── Create KnowledgeEntry per section
       │       └── Tag with career/topic from filename or content
       └── Return import summary
```

### Question Bank Parser

Pattern detected in reference files:
```markdown
## 1. Kubernetes Questions
### Basic
**Q: What is Kubernetes?**
A: Container orchestration platform...

**Q: What is a Pod?**
A: Smallest deployable unit...

### Intermediate
**Q: A pod is stuck in Pending...**
A: 1. kubectl describe pod...
```

Parser logic:
- H2 = topic name
- H3 = difficulty level (Basic→EASY, Intermediate→MEDIUM, Advanced→HARD)
- `**Q:**` = question start
- `A:` = answer start (until next `**Q:**` or heading)

### Knowledge Retrieval for Interviews

```
PromptBuilderService needs context for Round about "Kubernetes"
       │
       ▼
KnowledgeService.findByTopic("kubernetes", careerId)
       │
       ├── Search KnowledgeEntry where topicSlug = "kubernetes" AND careerId matches
       ├── Limit to top 5 entries by relevance (or random for variety)
       └── Return as context string for LLM prompt
```

## Related Code Files
- **Create**: `apps/api/src/modules/knowledge/knowledge.module.ts`
- **Create**: `apps/api/src/modules/knowledge/knowledge.controller.ts`
- **Create**: `apps/api/src/modules/knowledge/knowledge.service.ts`
- **Create**: `apps/api/src/modules/knowledge/markdown-parser.service.ts`
- **Create**: `apps/api/src/modules/knowledge/question-importer.service.ts`
- **Create**: `apps/web/src/pages/admin/knowledge.tsx`
- **Create**: `apps/web/src/components/admin/import-dialog.tsx`

## Implementation Steps

1. **MarkdownParserService**:
   - `parseQuestionBank(content, filename)` → array of `{ question, answer, topic, difficulty }`
   - `chunkByHeadings(content, maxChars)` → array of `{ title, content, headingLevel }`
   - Detect file type by content patterns (`**Q:**` presence → question bank)

2. **QuestionImporterService**:
   - Takes parsed Q/A pairs
   - Maps topic names to existing Topic records (fuzzy match by name)
   - Creates Question records in bulk (skipDuplicates by content hash)

3. **KnowledgeService**:
   - `importFromDirectory(dirPath)` → scan .md files, parse, import
   - `importFromFiles(files)` → parse uploaded files, import
   - `findByTopic(topicSlug, careerId, limit)` → return knowledge entries
   - `search(query, limit)` → PostgreSQL ILIKE search on title + content
   - CRUD operations for manual management

4. **Admin knowledge page**:
   - Import section: directory path input + "Import" button, or file upload area
   - Shows import progress/summary
   - List knowledge entries with search/filter
   - Edit/delete individual entries

## Todo List
- [ ] Create MarkdownParserService (question bank + heading chunker)
- [ ] Create QuestionImporterService
- [ ] Create KnowledgeService (import + CRUD + search)
- [ ] Create admin knowledge page
- [ ] Import dialog with progress feedback
- [ ] Integrate knowledge retrieval into PromptBuilderService
- [ ] Test import with actual reference files
- [ ] Verify imported questions appear in admin question list

## Success Criteria
- Import `devops-interview-questions-bank.md` → creates 50+ Question records with correct topics/difficulty
- Import study guides → creates chunked KnowledgeEntry records
- Knowledge entries used in interview prompts (visible in LLM context)
- Admin can search, edit, delete imported entries
- Duplicate import doesn't create duplicates

## Risk Assessment
- **Markdown format variations**: parser must be flexible; some files may not follow exact pattern
- **Topic mapping**: filename-based mapping may not always be accurate; admin can re-tag after import
