# Phase 7: Scoring & Evaluation

## Overview
- **Priority**: P2 (Enhancement on top of Phase 6)
- **Status**: Pending
- **Effort**: 4h
- LLM-powered scoring: per-answer (0-10) with feedback, round summaries, overall interview assessment.

## Key Insights
- Scoring happens at 3 levels: per-answer, per-round, per-session
- Per-answer scoring done inline during chat (LLM evaluates each answer)
- Round summary: triggered when round completes, LLM reviews all Q&A
- Overall summary: triggered when session completes, LLM reviews all rounds
- Scores stored in DB for analytics and progress tracking

## Requirements

### Functional
- Per-answer: score (0-10) + brief feedback stored in InterviewMessage
- Per-round: average score + strengths/improvements stored in InterviewRound
- Per-session: overall score + strengths/weaknesses/summary stored in InterviewSession
- Score history: user can view score trends over time
- Detailed review: view each answer with its score and feedback

### Non-Functional
- Scoring prompts must produce consistent, parseable JSON
- Fallback: if LLM returns invalid JSON, retry once with strict instruction

## Architecture

### Scoring Prompts

**Inline answer evaluation** (part of chat flow):
```
The candidate just answered a question about {topic}.
Question: {question}
Answer: {userAnswer}
Reference answer (if available): {expectedAnswer}

Evaluate the answer:
1. Score (0-10): based on technical accuracy, depth, relevance
2. Brief feedback (2-3 sentences): what was good, what was missing

Then ask the next interview question.

Format your response as:
[SCORE:7]
[FEEDBACK: Good understanding of X, but missed Y. Consider mentioning Z.]

{Your next question as the interviewer}
```

**Round summary prompt:**
```
Review this interview round conversation:
{allMessagesInRound}

Provide a JSON summary:
{
  "averageScore": number,
  "summary": "string (2-3 sentences)",
  "strengths": ["string"],
  "improvements": ["string"],
  "perAnswerScores": [
    { "questionIndex": 1, "score": number, "topic": "string" }
  ]
}
```

**Overall session summary prompt:**
```
Review all rounds of this mock interview for {careerName}:
{roundSummariesJSON}

Candidate profile: {cvStructuredDataBrief}

Provide overall assessment as JSON:
{
  "overallScore": number (0-10),
  "summary": "string (paragraph)",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "readinessLevel": "not_ready|needs_practice|mostly_ready|interview_ready",
  "topRecommendations": ["string (top 3-5 areas to improve)"]
}
```

## Related Code Files
- **Modify**: `apps/api/src/modules/interview/interview-chat.service.ts` (add inline scoring extraction)
- **Create**: `apps/api/src/modules/interview/scoring.service.ts`
- **Modify**: `apps/api/src/modules/interview/prompt-builder.service.ts` (add scoring prompts)
- **Create**: `apps/web/src/components/interview/score-badge.tsx`
- **Create**: `apps/web/src/components/interview/round-summary-card.tsx`
- **Create**: `apps/web/src/components/interview/overall-summary.tsx`
- **Create**: `apps/web/src/pages/interview/scores.tsx` (score history/trends)

## Implementation Steps

1. **Inline scoring extraction**: Parse LLM response for `[SCORE:X]` and `[FEEDBACK:...]` markers
   - Regex extraction from streamed response
   - Store score + feedback in InterviewMessage after stream complete
   - If markers not found, set score=null (LLM didn't follow format)

2. **ScoringService**:
   - `scoreRound(sessionId, roundNumber)` → build round summary prompt, call LLM, parse JSON, update InterviewRound
   - `scoreSession(sessionId)` → build overall prompt from round summaries, call LLM, parse JSON, update InterviewSession
   - JSON parsing with fallback: if invalid, retry with "respond ONLY with valid JSON"

3. **Frontend scoring UI**:
   - Score badge on each user message (small colored chip: green 7-10, yellow 4-6, red 0-3)
   - Round summary card shown after completing round
   - Overall summary page with radar chart (scores per topic) and recommendations

4. **Score history page**: list completed sessions with scores, filter by career

## Todo List
- [ ] Add scoring markers to chat prompts
- [ ] Implement inline score extraction from LLM responses
- [ ] Create ScoringService for round + session summaries
- [ ] Frontend: score badges on messages
- [ ] Frontend: round summary card
- [ ] Frontend: overall summary view
- [ ] Frontend: score history page
- [ ] Test scoring consistency across multiple interviews

## Success Criteria
- Each user answer gets a score (0-10) displayed inline
- Round completion shows summary with average score
- Session completion shows overall assessment with recommendations
- Score parsing handles LLM format variations gracefully
