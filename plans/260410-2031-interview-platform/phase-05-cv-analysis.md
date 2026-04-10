# Phase 5: CV Upload & LLM Analysis

## Overview
- **Priority**: P1 (Interview quality depends on CV-tailored questions)
- **Status**: Pending
- **Effort**: 5h
- Upload PDF CV → extract text → async LLM analysis → structured profile + gap report.

## Key Insights
- PDF parsing with `pdf-parse` gives raw text; LLM structures it
- Analysis is async (BullMQ job) — can take 30-60s depending on LLM
- Gap report compares CV skills vs career requirements (topics in DB)
- Structured data stored as JSON — reused by interview engine for question generation
- User can re-upload CV; previous analyses preserved for history

## Requirements

### Functional
- Upload PDF (max 10MB, PDF only)
- Extract text from PDF
- BullMQ job: send to LLM for structured extraction + gap analysis
- Store: raw text, structured data (skills, experience, projects, education), gap report
- Display analysis results on frontend
- Re-analyze against different career
- Status tracking: PENDING → PROCESSING → COMPLETED/FAILED

### Non-Functional
- File stored on local filesystem (Docker volume)
- Max 10MB upload
- Analysis timeout: 120s
- Retry failed jobs 2 times

## Architecture

```
User uploads PDF
       │
       ▼
POST /cv/upload
       │
       ├── Store file to /uploads/cv/{userId}/{uuid}.pdf
       ├── Extract text with pdf-parse
       ├── Create CvUpload + CvAnalysis(PENDING) records
       └── Enqueue BullMQ job "cv-analysis"
              │
              ▼
        CV Analysis Worker
              │
              ├── Read raw text from CvUpload
              ├── Build prompt: "Extract structured profile from this CV"
              ├── Call LLM → structured data JSON
              ├── Build prompt: "Compare CV against {career} requirements, identify gaps"
              ├── Call LLM → gap report JSON
              ├── Update CvAnalysis: status=COMPLETED, structuredData, gapReport
              └── On error: status=FAILED, error message
```

### LLM Prompts

**Structured Extraction Prompt:**
```
Analyze this CV and extract structured data as JSON:
{
  "name": "string",
  "currentRole": "string",
  "yearsOfExperience": number,
  "skills": [{ "name": "string", "level": "beginner|intermediate|advanced|expert", "evidence": "string" }],
  "experience": [{ "company": "string", "role": "string", "duration": "string", "highlights": ["string"] }],
  "projects": [{ "name": "string", "description": "string", "technologies": ["string"] }],
  "education": [{ "degree": "string", "institution": "string", "year": "string" }],
  "certifications": ["string"]
}

CV Text:
{cvRawText}
```

**Gap Analysis Prompt:**
```
Compare this candidate's profile against {careerName} requirements.
Required topics: {topicNames}

Candidate profile:
{structuredDataJSON}

Provide analysis as JSON:
{
  "overallReadiness": "not_ready|needs_work|mostly_ready|strong",
  "readinessScore": number (0-100),
  "strengths": [{ "topic": "string", "evidence": "string", "level": "string" }],
  "gaps": [{ "topic": "string", "severity": "critical|moderate|minor", "recommendation": "string" }],
  "recommendations": ["string"],
  "suggestedFocusAreas": ["string"]
}
```

## Related Code Files

### Backend
- **Create**: `apps/api/src/modules/cv/cv.module.ts`
- **Create**: `apps/api/src/modules/cv/cv.controller.ts`
- **Create**: `apps/api/src/modules/cv/cv.service.ts`
- **Create**: `apps/api/src/modules/cv/cv-analysis.processor.ts` (BullMQ worker)
- **Create**: `apps/api/src/modules/cv/dto/upload-cv.dto.ts`
- **Create**: `apps/api/src/modules/llm/llm.module.ts`
- **Create**: `apps/api/src/modules/llm/llm.service.ts` (shared OpenAI client wrapper)

### Frontend
- **Create**: `apps/web/src/pages/cv/upload.tsx`
- **Create**: `apps/web/src/pages/cv/analysis.tsx`
- **Create**: `apps/web/src/components/cv/cv-upload-form.tsx`
- **Create**: `apps/web/src/components/cv/gap-report-view.tsx`
- **Create**: `apps/web/src/components/cv/skills-chart.tsx`
- **Create**: `apps/web/src/services/cv-service.ts`

## Implementation Steps

### Backend

1. **LLM Module** (shared — used by CV analysis, interview engine, scoring)
   - `LlmService`: wraps OpenAI SDK, reads config from AppSettings DB
   - Methods: `chatCompletion(messages, options)`, `streamChatCompletion(messages, options)`
   - Reads base URL, API key, model, temperature from AppSettings on each call (or cache with TTL)
   - Returns typed responses

2. **CV Module**:
   - `POST /cv/upload` — multer file upload, pdf-parse extraction, enqueue job
   - `GET /cv/my` — list user's CV uploads with analysis status
   - `GET /cv/:id` — get single CV with analysis results
   - `POST /cv/:id/reanalyze?careerId=` — re-run analysis against different career
   - `DELETE /cv/:id` — delete CV and file

3. **CV Analysis Processor** (BullMQ):
   - Register queue "cv-analysis" in CvModule
   - Processor: extract structured data → gap analysis → update DB
   - Error handling: catch LLM errors, set FAILED status, store error message
   - Retry: 2 attempts with exponential backoff

4. **File upload config**:
   - Multer disk storage: `/uploads/cv/{userId}/`
   - File filter: PDF only
   - Size limit: 10MB

### Frontend

5. **Upload page**: drag-and-drop PDF upload, shows progress
6. **Analysis page**: displays structured profile (skills table, experience timeline) + gap report (strengths/gaps cards, readiness score)
7. **Polling**: poll `GET /cv/:id` every 3s while status is PENDING/PROCESSING, stop on COMPLETED/FAILED

## Todo List
- [ ] Create LlmModule + LlmService (shared OpenAI wrapper)
- [ ] Create CvModule with upload endpoint
- [ ] Implement PDF text extraction
- [ ] Create BullMQ queue + processor for CV analysis
- [ ] Write LLM prompts for extraction + gap analysis
- [ ] Implement frontend upload page
- [ ] Implement frontend analysis display
- [ ] Test with real CV PDF
- [ ] Handle edge cases (empty PDF, scanned image PDF)

## Success Criteria
- Upload PDF → see analysis results within 60s
- Structured data correctly extracts skills, experience, projects
- Gap report identifies real gaps against DevOps role topics
- Failed analysis shows error message, can retry
- File cleanup on CV deletion

## Risk Assessment
- **Scanned PDFs**: pdf-parse can't extract text from images. Mitigation: detect empty text, show error "scanned PDF not supported, please use text-based PDF"
- **LLM output format**: LLM may not return valid JSON. Mitigation: parse with try/catch, retry once with "respond only with valid JSON" instruction
- **Large CVs**: very long CV text may exceed LLM context. Mitigation: truncate to first 8000 chars

## Security Considerations
- Uploaded files not publicly accessible (served through authenticated endpoint)
- File path includes userId to prevent enumeration
- Validate file type server-side (not just extension — check PDF magic bytes)
