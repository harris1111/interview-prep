-- Migration: Initialize Interview Platform Schema
-- Created: 2026-04-10
-- Description: Creates complete schema for AI-powered mock interview platform

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- AUTH & USER MANAGEMENT
-- ============================================================================

CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  "deletedBy" INTEGER,
  FOREIGN KEY ("deletedBy") REFERENCES "User"(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_email ON "User"(email) WHERE "deletedAt" IS NULL;
CREATE INDEX idx_users_role ON "User"(role) WHERE "deletedAt" IS NULL;
CREATE INDEX idx_users_deleted ON "User"(id) WHERE "deletedAt" IS NULL;

CREATE TABLE "UserProfile" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER UNIQUE NOT NULL,
  "firstName" VARCHAR(255),
  "lastName" VARCHAR(255),
  bio TEXT,
  "targetRole" VARCHAR(255),
  "experienceYears" INTEGER,
  skills TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_profile_user_id ON "UserProfile"("userId");

-- ============================================================================
-- ROLES, TOPICS, QUESTIONS
-- ============================================================================

CREATE TABLE "Role" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  "deletedBy" INTEGER,
  FOREIGN KEY ("deletedBy") REFERENCES "User"(id) ON DELETE SET NULL
);

CREATE INDEX idx_role_name ON "Role"(name);
CREATE INDEX idx_role_deleted ON "Role"(id) WHERE "deletedAt" IS NULL;

CREATE TABLE "Topic" (
  id SERIAL PRIMARY KEY,
  "roleId" INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  "deletedBy" INTEGER,
  FOREIGN KEY ("roleId") REFERENCES "Role"(id) ON DELETE CASCADE,
  FOREIGN KEY ("deletedBy") REFERENCES "User"(id) ON DELETE SET NULL,
  UNIQUE ("roleId", slug)
);

CREATE INDEX idx_topic_role_id ON "Topic"("roleId");
CREATE INDEX idx_topic_deleted ON "Topic"(id) WHERE "deletedAt" IS NULL;

CREATE TABLE "Question" (
  id SERIAL PRIMARY KEY,
  "topicId" INTEGER NOT NULL,
  text TEXT NOT NULL,
  "difficultyLevel" VARCHAR(50) NOT NULL DEFAULT 'INTERMEDIATE',
  "expectedAnswer" TEXT,
  "isLlmGenerated" BOOLEAN DEFAULT FALSE,
  "generatedBy" VARCHAR(255),
  "createdBy" INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  "deletedBy" INTEGER,
  FOREIGN KEY ("topicId") REFERENCES "Topic"(id) ON DELETE CASCADE,
  FOREIGN KEY ("createdBy") REFERENCES "User"(id) ON DELETE SET NULL,
  FOREIGN KEY ("deletedBy") REFERENCES "User"(id) ON DELETE SET NULL
);

CREATE INDEX idx_question_topic ON "Question"("topicId");
CREATE INDEX idx_question_difficulty ON "Question"("difficultyLevel");
CREATE INDEX idx_question_topic_difficulty ON "Question"("topicId", "difficultyLevel") WHERE "deletedAt" IS NULL;
CREATE INDEX idx_question_deleted ON "Question"(id) WHERE "deletedAt" IS NULL;

-- ============================================================================
-- SCENARIO TEMPLATES & INTERVIEW SESSION STRUCTURE
-- ============================================================================

CREATE TABLE "ScenarioTemplate" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "roleId" INTEGER NOT NULL,
  "totalRounds" INTEGER NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdBy" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  "deletedBy" INTEGER,
  FOREIGN KEY ("roleId") REFERENCES "Role"(id) ON DELETE CASCADE,
  FOREIGN KEY ("createdBy") REFERENCES "User"(id),
  FOREIGN KEY ("deletedBy") REFERENCES "User"(id) ON DELETE SET NULL
);

CREATE INDEX idx_scenario_role ON "ScenarioTemplate"("roleId");
CREATE INDEX idx_scenario_active ON "ScenarioTemplate"("isActive") WHERE "deletedAt" IS NULL;
CREATE INDEX idx_scenario_deleted ON "ScenarioTemplate"(id) WHERE "deletedAt" IS NULL;

CREATE TABLE "ScenarioRound" (
  id SERIAL PRIMARY KEY,
  "scenarioId" INTEGER NOT NULL,
  "roundNumber" INTEGER NOT NULL,
  name VARCHAR(255),
  description TEXT,
  duration INTEGER,
  "questionsPerTopic" INTEGER DEFAULT 2,
  "overallDifficulty" VARCHAR(50) DEFAULT 'INTERMEDIATE',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("scenarioId") REFERENCES "ScenarioTemplate"(id) ON DELETE CASCADE,
  UNIQUE ("scenarioId", "roundNumber")
);

CREATE INDEX idx_scenario_round_scenario ON "ScenarioRound"("scenarioId");

CREATE TABLE "ScenarioRoundTopic" (
  id SERIAL PRIMARY KEY,
  "roundId" INTEGER NOT NULL,
  "topicId" INTEGER NOT NULL,
  "questionCount" INTEGER DEFAULT 1,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("roundId") REFERENCES "ScenarioRound"(id) ON DELETE CASCADE,
  FOREIGN KEY ("topicId") REFERENCES "Topic"(id) ON DELETE CASCADE,
  UNIQUE ("roundId", "topicId")
);

CREATE INDEX idx_scenario_round_topic_round ON "ScenarioRoundTopic"("roundId");
CREATE INDEX idx_scenario_round_topic_topic ON "ScenarioRoundTopic"("topicId");

-- ============================================================================
-- INTERVIEW SESSION & MESSAGES
-- ============================================================================

CREATE TABLE "InterviewSession" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "scenarioId" INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  "overallScore" FLOAT,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  feedback TEXT,
  "startedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  FOREIGN KEY ("scenarioId") REFERENCES "ScenarioTemplate"(id)
);

CREATE INDEX idx_interview_session_user ON "InterviewSession"("userId");
CREATE INDEX idx_interview_session_status ON "InterviewSession"("status");
CREATE INDEX idx_interview_session_user_status ON "InterviewSession"("userId", "status");
CREATE INDEX idx_interview_session_started ON "InterviewSession"("startedAt");

CREATE TABLE "InterviewRound" (
  id SERIAL PRIMARY KEY,
  "sessionId" INTEGER NOT NULL,
  "roundNumber" INTEGER NOT NULL,
  "topicId" INTEGER,
  "questionsAsked" INTEGER DEFAULT 0,
  "roundScore" FLOAT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"(id) ON DELETE CASCADE,
  UNIQUE ("sessionId", "roundNumber")
);

CREATE INDEX idx_interview_round_session ON "InterviewRound"("sessionId");
CREATE INDEX idx_interview_round_topic ON "InterviewRound"("topicId");
CREATE INDEX idx_interview_round_session_number ON "InterviewRound"("sessionId", "roundNumber");

CREATE TABLE "InterviewMessage" (
  id SERIAL PRIMARY KEY,
  "sessionId" INTEGER NOT NULL,
  "roundId" INTEGER NOT NULL,
  "questionId" INTEGER,
  role VARCHAR(50) NOT NULL DEFAULT 'ASSISTANT',
  content TEXT NOT NULL,
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"(id) ON DELETE CASCADE,
  FOREIGN KEY ("roundId") REFERENCES "InterviewRound"(id) ON DELETE CASCADE,
  FOREIGN KEY ("questionId") REFERENCES "Question"(id) ON DELETE SET NULL
);

CREATE INDEX idx_interview_message_session ON "InterviewMessage"("sessionId");
CREATE INDEX idx_interview_message_round ON "InterviewMessage"("roundId");
CREATE INDEX idx_interview_message_role ON "InterviewMessage"(role);
CREATE INDEX idx_interview_message_created ON "InterviewMessage"("createdAt");
CREATE INDEX idx_interview_message_round_created ON "InterviewMessage"("roundId", "createdAt" DESC);

CREATE TABLE "AnswerScore" (
  id SERIAL PRIMARY KEY,
  "messageId" INTEGER NOT NULL,
  "questionId" INTEGER,
  "roundId" INTEGER NOT NULL,
  score FLOAT NOT NULL,
  feedback TEXT NOT NULL,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  "evaluationMeta" JSONB,
  "evaluatedBy" INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("messageId") REFERENCES "InterviewMessage"(id) ON DELETE CASCADE,
  FOREIGN KEY ("questionId") REFERENCES "Question"(id),
  FOREIGN KEY ("roundId") REFERENCES "InterviewRound"(id) ON DELETE CASCADE,
  FOREIGN KEY ("evaluatedBy") REFERENCES "User"(id)
);

CREATE INDEX idx_answer_score_message ON "AnswerScore"("messageId");
CREATE INDEX idx_answer_score_round ON "AnswerScore"("roundId");
CREATE INDEX idx_answer_score_score ON "AnswerScore"(score);

-- ============================================================================
-- CV UPLOAD & ANALYSIS
-- ============================================================================

CREATE TABLE "CVUpload" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  filename VARCHAR(255) NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  "uploadUrl" VARCHAR(512),
  "errorMsg" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX idx_cv_upload_user ON "CVUpload"("userId");
CREATE INDEX idx_cv_upload_status ON "CVUpload"(status);

CREATE TABLE "CVParsed" (
  id SERIAL PRIMARY KEY,
  "cvUploadId" INTEGER UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  skills TEXT[] DEFAULT '{}',
  experience JSONB,
  education JSONB,
  projects JSONB,
  languages TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  "extractedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("cvUploadId") REFERENCES "CVUpload"(id) ON DELETE CASCADE
);

CREATE INDEX idx_cv_parsed_upload ON "CVParsed"("cvUploadId");

CREATE TABLE "CVAnalysis" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "cvUploadId" INTEGER UNIQUE NOT NULL,
  "targetRoleId" INTEGER,
  "missingSkills" TEXT[] DEFAULT '{}',
  "experienceGaps" JSONB,
  "strengthAreas" TEXT[] DEFAULT '{}',
  recommendations JSONB,
  "overallFit" FLOAT,
  "analysisPrompt" TEXT,
  "analyzedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  FOREIGN KEY ("cvUploadId") REFERENCES "CVUpload"(id) ON DELETE CASCADE,
  FOREIGN KEY ("targetRoleId") REFERENCES "Role"(id)
);

CREATE INDEX idx_cv_analysis_user ON "CVAnalysis"("userId");
CREATE INDEX idx_cv_analysis_user_created ON "CVAnalysis"("userId", "analyzedAt" DESC);
CREATE INDEX idx_cv_analysis_target_role ON "CVAnalysis"("targetRoleId");

-- ============================================================================
-- KNOWLEDGE BASE (for RAG)
-- ============================================================================

CREATE TABLE "KnowledgeBase" (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(255),
  content TEXT NOT NULL,
  source VARCHAR(255),
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdBy" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  "deletedBy" INTEGER,
  FOREIGN KEY ("createdBy") REFERENCES "User"(id),
  FOREIGN KEY ("deletedBy") REFERENCES "User"(id) ON DELETE SET NULL
);

CREATE INDEX idx_knowledge_base_slug ON "KnowledgeBase"(slug);
CREATE INDEX idx_knowledge_base_category ON "KnowledgeBase"(category);
CREATE INDEX idx_knowledge_base_active ON "KnowledgeBase"("isActive") WHERE "deletedAt" IS NULL;
CREATE INDEX idx_knowledge_base_deleted ON "KnowledgeBase"(id) WHERE "deletedAt" IS NULL;

CREATE TABLE "KnowledgeBaseVector" (
  id SERIAL PRIMARY KEY,
  "kbId" INTEGER NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  chunk TEXT NOT NULL,
  embedding VECTOR(1536),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("kbId") REFERENCES "KnowledgeBase"(id) ON DELETE CASCADE
);

CREATE INDEX idx_knowledge_base_vector_kb ON "KnowledgeBaseVector"("kbId");
CREATE INDEX idx_knowledge_base_vector_embedding ON "KnowledgeBaseVector" USING ivfflat (embedding vector_cosine_ops);

-- ============================================================================
-- LLM CONFIGURATION
-- ============================================================================

CREATE TABLE "LLMConfig" (
  id SERIAL PRIMARY KEY,
  "generationModel" VARCHAR(255) NOT NULL DEFAULT 'gpt-4-turbo',
  "generationBaseUrl" VARCHAR(512),
  "generationApiKey" VARCHAR(512),
  "generationTemp" FLOAT DEFAULT 0.7,
  "evaluationModel" VARCHAR(255) NOT NULL DEFAULT 'gpt-4-turbo',
  "evaluationBaseUrl" VARCHAR(512),
  "evaluationApiKey" VARCHAR(512),
  "evaluationTemp" FLOAT DEFAULT 0.3,
  "questionGenPrompt" TEXT DEFAULT 'You are an expert technical interviewer...',
  "evaluationPrompt" TEXT DEFAULT 'Evaluate the candidate answer...',
  "cvAnalysisModel" VARCHAR(255) NOT NULL DEFAULT 'gpt-4-turbo',
  "cvAnalysisPrompt" TEXT DEFAULT 'Analyze this resume for gaps relative to the target role...',
  "useKnowledgeBase" BOOLEAN DEFAULT TRUE,
  "maxContextChunks" INTEGER DEFAULT 5,
  "similarityThreshold" FLOAT DEFAULT 0.7,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("generationModel")
);

-- ============================================================================
-- SEED DATA (Optional)
-- ============================================================================

-- INSERT INTO "Role" (name, description) VALUES
-- ('DevOps Engineer', 'Manages infrastructure, CI/CD, and deployment pipelines'),
-- ('Backend Developer', 'Builds server-side applications and APIs'),
-- ('Frontend Developer', 'Creates user interfaces and client-side applications'),
-- ('Product Manager', 'Defines product strategy and requirements')
-- ON CONFLICT (name) DO NOTHING;

-- INSERT INTO "Topic" ("roleId", name, slug, description) VALUES
-- (1, 'Kubernetes', 'kubernetes', 'Container orchestration platform'),
-- (1, 'CI/CD', 'ci-cd', 'Continuous integration and continuous deployment'),
-- (2, 'System Design', 'system-design', 'Designing large-scale distributed systems'),
-- (2, 'Databases', 'databases', 'Database design and optimization')
-- ON CONFLICT ("roleId", slug) DO NOTHING;
