# Phase 4: Admin Panel & CRUD

## Overview
- **Priority**: P1 (Admin manages all content)
- **Status**: Pending
- **Effort**: 5h
- Admin dashboard with CRUD for careers, topics, questions, scenario templates, users, LLM config.

## Key Insights
- Admin panel is a section of the same React app (not separate app)
- All admin API endpoints guarded by RolesGuard(ADMIN)
- Question editor needs markdown support (expected answers are markdown)
- Scenario template builder = configure rounds + assign topics + set difficulty

## Requirements

### Functional
- **Careers CRUD**: name, slug, description, active toggle
- **Topics CRUD**: name, slug, parent career, sort order
- **Questions CRUD**: content, expected answer, difficulty, topic, tags, active toggle
- **Scenario Templates**: name, career, rounds config (round number, name, topics, question count, difficulty, duration)
- **User Management**: list users, toggle role (admin/user), toggle active
- **LLM Settings**: base URL, API key (masked), model, temperature, system prompt. Test connection button.
- **Dashboard**: overview stats (total users, sessions, questions, avg scores)

### Non-Functional
- Pagination on list views (20 items/page)
- Search/filter on questions (by topic, difficulty, tags)
- Responsive layout (but desktop-first — admin tool)

## Architecture

### API Endpoints

```
# Careers
GET    /admin/careers
POST   /admin/careers
PATCH  /admin/careers/:id
DELETE /admin/careers/:id

# Topics
GET    /admin/topics?careerId=
POST   /admin/topics
PATCH  /admin/topics/:id
DELETE /admin/topics/:id

# Questions
GET    /admin/questions?topicId=&difficulty=&search=&page=&limit=
POST   /admin/questions
PATCH  /admin/questions/:id
DELETE /admin/questions/:id  (soft delete — sets isActive=false)

# Scenario Templates
GET    /admin/scenarios?careerId=
POST   /admin/scenarios       (with nested rounds + topic assignments)
PATCH  /admin/scenarios/:id
DELETE /admin/scenarios/:id

# Users
GET    /admin/users?search=&role=&page=
PATCH  /admin/users/:id/role
PATCH  /admin/users/:id/active

# Settings
GET    /admin/settings
PATCH  /admin/settings
POST   /admin/settings/test-llm  (test LLM connection)

# Dashboard
GET    /admin/dashboard/stats
```

## Related Code Files

### Backend
- **Create**: `apps/api/src/modules/admin/admin.module.ts`
- **Create**: `apps/api/src/modules/admin/controllers/career.controller.ts`
- **Create**: `apps/api/src/modules/admin/controllers/topic.controller.ts`
- **Create**: `apps/api/src/modules/admin/controllers/question.controller.ts`
- **Create**: `apps/api/src/modules/admin/controllers/scenario.controller.ts`
- **Create**: `apps/api/src/modules/admin/controllers/user-management.controller.ts`
- **Create**: `apps/api/src/modules/admin/controllers/settings.controller.ts`
- **Create**: `apps/api/src/modules/admin/controllers/dashboard.controller.ts`
- **Create**: `apps/api/src/modules/admin/services/` (matching services)
- **Create**: `apps/api/src/modules/admin/dto/` (validation DTOs)

### Frontend
- **Create**: `apps/web/src/pages/admin/layout.tsx` (sidebar nav)
- **Create**: `apps/web/src/pages/admin/dashboard.tsx`
- **Create**: `apps/web/src/pages/admin/careers.tsx`
- **Create**: `apps/web/src/pages/admin/topics.tsx`
- **Create**: `apps/web/src/pages/admin/questions.tsx`
- **Create**: `apps/web/src/pages/admin/scenarios.tsx`
- **Create**: `apps/web/src/pages/admin/users.tsx`
- **Create**: `apps/web/src/pages/admin/settings.tsx`
- **Create**: `apps/web/src/components/admin/` (shared admin components: DataTable, FormDialog, etc.)

## Implementation Steps

1. Create AdminModule with all controllers/services, guarded globally by RolesGuard(ADMIN)
2. Implement Career CRUD (simplest — warm up pattern)
3. Implement Topic CRUD (filtered by career)
4. Implement Question CRUD with search/filter/pagination
5. Implement Scenario Template CRUD with nested round creation
   - POST body includes rounds array with topic IDs
   - Service creates ScenarioTemplate + RoundTemplates + RoundTemplateTopics in transaction
6. Implement User Management (list + role toggle)
7. Implement Settings (get/update AppSettings singleton + test LLM endpoint)
   - Test LLM: send simple completion request, return success/error
8. Implement Dashboard stats (aggregate queries)

### Frontend
9. Create admin layout with sidebar navigation
10. Build reusable DataTable component (pagination, search, sort)
11. Build form dialogs for create/edit operations
12. Wire up all CRUD pages using React Query + admin API service
13. LLM settings page with connection test feedback

## Todo List
- [ ] Backend: AdminModule structure
- [ ] Backend: Career CRUD
- [ ] Backend: Topic CRUD
- [ ] Backend: Question CRUD with search/pagination
- [ ] Backend: Scenario Template CRUD with nested rounds
- [ ] Backend: User management endpoints
- [ ] Backend: Settings + LLM test connection
- [ ] Backend: Dashboard stats
- [ ] Frontend: Admin layout + sidebar
- [ ] Frontend: Reusable DataTable + FormDialog components
- [ ] Frontend: All CRUD pages
- [ ] Frontend: LLM settings with test button

## Success Criteria
- Admin can CRUD all entities from the web UI
- Scenario template creation includes round configuration
- LLM test connection returns success/failure
- Pagination and search work on question list
- Non-admin users get 403 on all admin endpoints
