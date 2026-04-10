# Interview Review Platform — User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [CV Management](#cv-management)
4. [Interview Sessions](#interview-sessions)
5. [Scores & Review](#scores--review)
6. [Admin Panel](#admin-panel)

---

## Getting Started

The Interview Review Platform is an AI-powered mock interview tool. It analyzes your CV, generates interview questions based on your target career, and provides real-time AI interviewer responses with scoring and feedback.

**Default URLs:**
- Frontend: `http://localhost:3000`
- API: `http://localhost:4000/api`

### Quick Start

1. Register an account or login
2. Upload your CV (PDF)
3. Select an interview scenario
4. Practice with the AI interviewer
5. Review your scores and feedback

---

## Authentication

### Register

Navigate to `/auth/register`. Provide:
- **Name** — your display name
- **Email** — used for login and verification
- **Password** — minimum requirements apply

After registration, check your email for a verification link. In development mode, accounts are auto-verified.

### Login

Navigate to `/auth/login` (or click "Sign In" on the homepage). Enter your email and password.

**Dev admin account:** `admin@admin.com` / `admin`

### Password Recovery

1. Click "Forgot password?" on the login page
2. Enter your email address
3. Check email for a reset link
4. Set a new password via the link

---

## CV Management

### Upload a CV

1. Click **CV** in the top navigation bar
2. Click **Upload CV**
3. Select a PDF file (max 10 MB)
4. Optionally select a **target career** for gap analysis
5. Click **Upload**

The system will:
- Extract text from your PDF
- Queue an AI analysis job (runs in background)
- Generate structured data (skills, experience, education)
- If a target career is selected, generate a **gap report**

### View My CVs

Navigate to **CV → My CVs** (`/cv/my`). You'll see a list of all uploaded CVs with their analysis status:
- **Pending** — analysis queued
- **Processing** — AI is analyzing
- **Completed** — ready to view
- **Failed** — analysis error (you can re-analyze)

Click any CV to view its full analysis, structured data, and gap report.

### Re-analyze a CV

On the CV detail page, click **Re-analyze** to run a new analysis. You can change the target career for a different gap report.

---

## Interview Sessions

### Start an Interview

1. Navigate to **Interview → Start** (`/interview/start`)
2. Select an **Interview Scenario** (e.g., "DevOps Engineer Full Interview")
3. Optionally attach a **CV Analysis** — the AI interviewer will reference your background
4. Click **Start Interview**

### During the Interview

The interview is organized into **rounds**, each with a specific topic focus:

- The AI interviewer asks you questions based on the round's topic
- Type your answers in the message input box
- The AI responds in real-time via streaming (you'll see tokens appear progressively)
- Continue the conversation naturally — the AI will probe deeper or move to the next question

**Controls:**
- **Send** — submit your message
- **Complete Round** — finish the current round and get scored
- **Next Round** — advance to the next round after completing the current one
- **Complete Interview** — finish all rounds and get an overall score

### Interview Flow

```
Start → Round 1 → Complete Round 1 → Round 2 → ... → Complete Interview
```

Each round covers specific topics. For example, in the DevOps Engineer scenario:
1. **Kubernetes & Docker** — containerization and orchestration
2. **CI/CD & IaC** — pipelines and infrastructure as code
3. **Linux, Networking & Security** — sysadmin fundamentals
4. **Cloud & Monitoring** — GCP, observability, cost optimization
5. **Behavioral & Scenario** — STAR format, situational questions

### Tips for Best Results

- Answer as you would in a real interview
- Be specific — reference actual tools, technologies, and experiences
- The AI will follow up if your answer is vague
- Attaching your CV analysis gives the interviewer context about your background

---

## Scores & Review

### View Scores

Navigate to **Scores** (`/interview/scores`) to see all your completed interviews with:
- **Overall Score** (out of 10)
- **Per-round scores**
- **Date and scenario name**

### Review an Interview

Click on any completed session to view the full **Interview Review** page (`/interview/:id/review`):
- Complete conversation history per round
- Round-by-round scores and feedback
- **Strengths** identified by the AI
- **Areas for improvement** with specific suggestions
- Overall feedback and recommendation

### Interview History

Navigate to **Interview → History** (`/interview/history`) to see all sessions:
- **Draft** — started but not begun
- **In Progress** — currently active
- **Completed** — finished with scores
- **Abandoned** — cancelled

---

## Admin Panel

*Requires ADMIN role. Navigate to `/admin`.*

### Dashboard

Overview statistics:
- Total users, sessions, questions, careers, topics, scenarios
- Average interview score
- Recent session activity

### Careers

Manage career paths (e.g., "DevOps Engineer", "Frontend Developer"):
- **Create** — name + description
- **Edit** — update name, description, toggle active/inactive
- **Delete** — removes career and cascades to topics

### Topics

Manage topics per career (e.g., "Kubernetes", "CI/CD"):
- Organized by career
- Sortable order
- Each topic organizes questions

### Questions

Manage the question bank:
- **Filter** by topic, difficulty, search text
- **Create** — question text, expected answer, difficulty (Easy/Medium/Hard/Expert), tags
- **Edit/Delete** — soft-delete preserves data
- Questions are automatically imported from markdown question banks

### Scenarios

Design interview templates with multiple rounds:
- **Name** and **career** assignment
- **Rounds** — each round has a name, topic assignments, duration, question count, difficulty
- Rounds group topics for structured interviews

### Knowledge Base

Import and manage reference materials:
- **Import Files** — upload markdown files (up to 20, max 5 MB each)
  - **Question banks** (detected by `**Q:` pattern) → imported as questions
  - **Study guides** → chunked into searchable knowledge entries
- **Create/Edit** entries manually
- Search across all entries

### Users

- View registered users
- Promote/demote user roles (ADMIN ↔ USER)

### Settings

Configure the LLM (AI) backend:
- **Base URL** — API endpoint (OpenAI-compatible)
- **API Key** — authentication
- **Model** — e.g., `gpt-4o`, `gpt-3.5-turbo`
- **Temperature** — creativity level (0.0–1.0)
- **System Prompt** — customize the interviewer's behavior
- **Test Connection** — verify the configuration works

---

## Importing Data

### Question Bank Format

The system auto-detects question bank files by the `**Q:` pattern. Format:

```markdown
## Topic Name

### Basic
**Q: What is Kubernetes?**
A: Container orchestration platform for automating deployment and scaling.

### Intermediate
**Q: How do you troubleshoot a CrashLoopBackOff?**
A: Check logs, describe pod, verify configurations...
```

- `## ` headings = topic names (must match existing topics)
- `### ` headings = difficulty: Basic→EASY, Intermediate→MEDIUM, Advanced→HARD, Expert→EXPERT
- Duplicates are automatically skipped (MD5 hash comparison)

### Study Guide Format

Any markdown without the `**Q:` pattern is treated as a study guide:

```markdown
# Kubernetes Deep Dive

## Pod Lifecycle
Content about pod lifecycle...

## Services and Networking
Content about services...
```

- Chunked by H2 headings into individual knowledge entries
- Each chunk ≤ 2000 characters (auto-split if larger)
- Stored with source filename and "imported" tag

### Bulk Import via Admin Panel

1. Go to **Admin → Knowledge**
2. Click **Import Files**
3. Select multiple `.md` files
4. Review the import summary (files processed, questions imported, entries created, errors)

### Bulk Import via Script

A PowerShell script is provided for bulk data setup:

```powershell
.\scripts\import-devops-data.ps1
```

This creates a complete DevOps Engineer career with topics, a 5-round scenario, CV upload, and imports question banks + study guides.

---

## Keyboard Shortcuts

- **Enter** — send message (during interview)
- **Shift+Enter** — new line in message input

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CV analysis stuck on "Pending" | Check Redis is running and BullMQ worker is active |
| AI responses not streaming | Verify LLM settings in Admin → Settings → Test Connection |
| "Unauthorized" errors | Token expired — re-login |
| CORS errors | Ensure `WEB_URL` in `.env` matches frontend URL |
| Redis port conflict (Windows) | Use port 6500 instead of 6379 (Hyper-V reserves ports) |
