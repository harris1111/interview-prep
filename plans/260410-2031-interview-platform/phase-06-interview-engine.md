# Phase 6: Interview Engine & Chat

## Overview
- **Priority**: P1 (Core feature)
- **Status**: Pending
- **Effort**: 8h
- ChatGPT-like interview experience: user selects scenario → LLM conducts mock interview round by round → SSE streaming responses.

## Key Insights
- This is the core product. Must feel natural like a real interview.
- LLM acts as interviewer: asks questions, follows up, probes deeper based on answers
- Questions are hybrid: some from DB (fixed), some LLM-generated based on CV + knowledge base
- Each round has a topic focus; LLM stays on topic but adapts to user's responses
- SSE streaming for real-time token display (unidirectional — LLM → client)
- Round transitions are explicit (user clicks "Next Round" or auto-advance)

## Requirements

### Functional
- Start interview: select scenario template + optionally link a CV analysis
- Session created with rounds matching template
- Per-round chat: LLM asks question → user answers → LLM evaluates + asks next
- LLM uses: scenario context, round topic, CV analysis (if available), knowledge base entries, question bank
- Streaming responses via SSE
- Pause/resume interview (session persists)
- End round: LLM provides round summary + score
- End interview: overall summary + score
- View past interview sessions and chat history

### Non-Functional
- SSE endpoint with proper error handling and reconnection
- Messages persisted to DB in real-time
- LLM context window management (summarize older messages if too long)
- Timeout: 120s per LLM call

## Architecture

### Interview Flow

```
1. User selects ScenarioTemplate + (optional) CvAnalysis
2. API creates InterviewSession + InterviewRounds
3. User enters Round 1 chat
4. System sends initial prompt to LLM:
   "You are an interviewer for {career} position.
    Round {n}: {topic}. Difficulty: {difficulty}.
    Candidate profile: {cvStructuredData}
    Knowledge base context: {relevantKnowledgeEntries}
    Fixed questions to include: {fixedQuestionsFromDB}
    Ask {questionCount} questions. Start now."
5. LLM streams first question → displayed to user
6. User types answer → sent to API
7. API appends to message history, calls LLM:
   "Evaluate the answer briefly, then ask the next question."
8. LLM streams evaluation + next question
9. Repeat until questionCount reached
10. Final LLM call: "Summarize this round. Score each answer 0-10."
11. Store round scores + feedback
12. User proceeds to next round or ends interview
13. After all rounds: overall summary + score
```

### SSE Streaming Architecture

```
Client                    NestJS API                  LLM API
  │                          │                           │
  │ POST /interview/:id/     │                           │
  │      rounds/:rn/message  │                           │
  │ { content: "answer" }    │                           │
  │─────────────────────────►│                           │
  │                          │ save user message to DB   │
  │                          │                           │
  │ GET /interview/:id/      │                           │
  │     rounds/:rn/stream    │                           │
  │ (SSE connection)         │                           │
  │◄─────────────────────────│                           │
  │                          │ POST /chat/completions    │
  │                          │ stream: true              │
  │                          │──────────────────────────►│
  │                          │                           │
  │                          │◄──chunk─chunk─chunk──done─│
  │◄──SSE: data──────────────│                           │
  │◄──SSE: data──────────────│                           │
  │◄──SSE: [DONE]────────────│ save full message to DB   │
```

### API Endpoints

```
# Interview Sessions
POST   /interview/start          { scenarioId, cvAnalysisId? }
GET    /interview/my             list user's sessions
GET    /interview/:id            session detail with rounds
DELETE /interview/:id            abandon session

# Round Chat
POST   /interview/:id/rounds/:roundNumber/message   { content }
GET    /interview/:id/rounds/:roundNumber/stream     SSE endpoint
GET    /interview/:id/rounds/:roundNumber/messages   chat history
POST   /interview/:id/rounds/:roundNumber/complete   trigger round summary

# Session Completion
POST   /interview/:id/complete   trigger overall summary
```

## Related Code Files

### Backend
- **Create**: `apps/api/src/modules/interview/interview.module.ts`
- **Create**: `apps/api/src/modules/interview/interview.controller.ts`
- **Create**: `apps/api/src/modules/interview/interview.service.ts`
- **Create**: `apps/api/src/modules/interview/interview-chat.service.ts` (LLM orchestration)
- **Create**: `apps/api/src/modules/interview/interview-stream.controller.ts` (SSE)
- **Create**: `apps/api/src/modules/interview/prompt-builder.service.ts`
- **Create**: `apps/api/src/modules/interview/dto/start-interview.dto.ts`
- **Create**: `apps/api/src/modules/interview/dto/send-message.dto.ts`

### Frontend
- **Create**: `apps/web/src/pages/interview/start.tsx` (scenario selection)
- **Create**: `apps/web/src/pages/interview/session.tsx` (main interview page)
- **Create**: `apps/web/src/pages/interview/history.tsx` (past sessions)
- **Create**: `apps/web/src/pages/interview/review.tsx` (review completed session)
- **Create**: `apps/web/src/components/interview/chat-window.tsx`
- **Create**: `apps/web/src/components/interview/message-bubble.tsx`
- **Create**: `apps/web/src/components/interview/round-sidebar.tsx`
- **Create**: `apps/web/src/components/interview/streaming-text.tsx`
- **Create**: `apps/web/src/hooks/use-llm-stream.ts` (fetch+ReadableStream, NOT EventSource)
- **Create**: `apps/web/src/services/interview-service.ts`

## Implementation Steps

### Backend

1. **PromptBuilderService**: Constructs LLM prompts for each interview phase
   - `buildRoundStartPrompt(round, cvAnalysis, knowledgeEntries, fixedQuestions)` → system + initial message
   - `buildFollowUpPrompt(messageHistory)` → continue conversation
   - `buildRoundSummaryPrompt(messageHistory)` → evaluate + score
   - `buildOverallSummaryPrompt(roundSummaries)` → final assessment
   - Include relevant knowledge base entries (search by topic)
   - Include fixed questions from DB (topic + difficulty match)

2. **InterviewService**: Session lifecycle
   - `startInterview(userId, dto)` → create session + rounds from template
   - `getSession(id)` → with rounds, messages, scores
   - `completeRound(sessionId, roundNumber)` → trigger summary LLM call, store scores
   - `completeInterview(sessionId)` → trigger overall summary

3. **InterviewChatService**: Message handling + LLM orchestration
   - `sendMessage(sessionId, roundNumber, content)` → save user message, determine if need LLM response
   - `streamResponse(sessionId, roundNumber)` → SSE stream of LLM response
   - Build message history from DB for LLM context
   - If message history too long (>6000 tokens estimate), summarize older messages

4. **SSE Controller**:
   - NestJS `@Sse()` decorator on stream endpoint
   - Return `Observable<MessageEvent>` from `streamResponse`
   - Use `openai.chat.completions.create({ stream: true })` and pipe chunks to SSE
   - On stream complete: save full assistant message to DB
   - Error handling: send SSE error event, close connection

5. **Context window management**:
   - Keep last 10 messages in full
   - Summarize older messages into a "conversation so far" block
   - Include system prompt + CV context + knowledge base always

### Frontend

6. **Start page**: 
   - Select scenario template (cards with description)
   - Optionally select CV analysis (dropdown of user's analyses)
   - "Start Interview" button

7. **Session page (main interview)**:
   - Left sidebar: round list with status indicators
   - Main area: chat window
   - Chat input at bottom (textarea + send button)
   - On send: POST message, then connect to SSE stream
   - `useSSEStream` hook: EventSource connection, accumulate tokens, display with typing effect
   - "Complete Round" button after enough Q&A
   - "Next Round" → advance to next round chat

8. **Streaming text component**:
   - **IMPORTANT**: Use `fetch()` + `ReadableStream` (NOT `EventSource`) — EventSource can't send auth headers or POST bodies
   - `useLlmStream` hook: POST message to API, read response as stream via `response.body.getReader()`
   - Parse SSE chunks manually: split by `data: ` lines, accumulate tokens
   - Renders markdown as tokens arrive
   - Smooth character-by-character display
   - Auto-scroll to bottom

9. **History page**: list past sessions with date, scenario, score, status
10. **Review page**: read-only view of completed session with all messages + scores

## Todo List
- [ ] Create PromptBuilderService with all prompt templates
- [ ] Create InterviewService (session lifecycle)
- [ ] Create InterviewChatService (message + LLM orchestration)
- [ ] Implement SSE streaming controller
- [ ] Implement context window management (summarization)
- [ ] Create frontend start page (scenario + CV selection)
- [ ] Create frontend chat window with streaming
- [ ] Create useSSEStream hook
- [ ] Create round sidebar navigation
- [ ] Create history + review pages
- [ ] Test full interview flow (start → chat → complete round → complete session)
- [ ] Test streaming with different LLM providers

## Success Criteria
- Start interview → LLM asks first question within 3s
- Streaming tokens appear in real-time in chat
- Messages persist — can refresh and resume
- Round completion produces per-answer scores
- Interview completion produces overall summary
- Past sessions viewable with full chat history

## Risk Assessment
- **SSE connection drops**: implement auto-reconnect in frontend, resume from last message
- **LLM context overflow**: summarization logic prevents exceeding context window
- **Slow LLM responses**: 120s timeout, show loading indicator, user can cancel
- **Concurrent sessions**: one active session per user (enforce in API)

## Security Considerations
- Users can only access their own sessions
- SSE endpoint authenticated via JWT (pass token as query param for EventSource)
- Rate limit message sending (1 msg/3s to prevent spam)
