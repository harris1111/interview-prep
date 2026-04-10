import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { PromptBuilderService } from './prompt-builder.service';

export interface InlineScore {
  score: number | null;
  feedback: string | null;
  cleanContent: string;
}

export interface RoundScore {
  averageScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  perAnswerScores: Array<{
    questionIndex: number;
    score: number;
    topic: string;
  }>;
}

export interface SessionScore {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  readinessLevel: string;
  topRecommendations: string[];
}

@Injectable()
export class ScoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
    private readonly promptBuilder: PromptBuilderService,
  ) {}

  /**
   * Extract inline score and feedback from LLM response
   * Parses [SCORE:X] and [FEEDBACK:...] markers
   */
  extractInlineScore(llmResponse: string): InlineScore {
    const scoreMatch = llmResponse.match(/\[SCORE:(\d+(?:\.\d+)?)\]/);
    const feedbackMatch = llmResponse.match(/\[FEEDBACK:(.*?)\]/s);

    const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : null;

    // Remove markers from content
    let cleanContent = llmResponse;
    if (scoreMatch) {
      cleanContent = cleanContent.replace(scoreMatch[0], '');
    }
    if (feedbackMatch) {
      cleanContent = cleanContent.replace(feedbackMatch[0], '');
    }

    // Clean up extra whitespace
    cleanContent = cleanContent.trim();

    return {
      score,
      feedback,
      cleanContent,
    };
  }

  /**
   * Score a completed interview round
   * Analyzes all Q&A pairs and provides summary evaluation
   */
  async scoreRound(sessionId: string, roundNumber: number): Promise<RoundScore> {
    // Get round with messages
    const round = await this.prisma.interviewRound.findUnique({
      where: {
        sessionId_roundNumber: { sessionId, roundNumber },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        session: {
          include: {
            scenario: {
              include: {
                career: true,
              },
            },
          },
        },
      },
    });

    if (!round) {
      throw new NotFoundException('Interview round not found');
    }

    // Build round scoring prompt
    const messages = this.promptBuilder.buildRoundScoringPrompt(
      round.messages,
      round.topicFocus,
      roundNumber,
    );

    // Get evaluation from LLM
    const evaluation = await this.llmService.parseJsonResponse<RoundScore>(messages);

    // Validate and clamp score to 0-10 range
    const rawScore = Number(evaluation.averageScore);
    const validatedScore = Number.isFinite(rawScore)
      ? Math.min(10, Math.max(0, rawScore))
      : 0;

    // Ensure evaluation has expected structure
    const roundScore: RoundScore = {
      averageScore: validatedScore,
      summary: typeof evaluation.summary === 'string' ? evaluation.summary : 'No summary available',
      strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
      improvements: Array.isArray(evaluation.improvements) ? evaluation.improvements : [],
      perAnswerScores: Array.isArray(evaluation.perAnswerScores)
        ? evaluation.perAnswerScores.map((s: any) => ({
            questionIndex: Number(s.questionIndex) || 0,
            score: Number.isFinite(Number(s.score)) ? Math.min(10, Math.max(0, Number(s.score))) : 0,
            topic: typeof s.topic === 'string' ? s.topic : '',
          }))
        : [],
    };

    // Update round with score and feedback
    await this.prisma.interviewRound.update({
      where: { id: round.id },
      data: {
        score: roundScore.averageScore,
        feedback: roundScore as any,
      },
    });

    return roundScore;
  }

  /**
   * Score the entire interview session
   * Combines all round evaluations into overall assessment
   */
  async scoreSession(sessionId: string): Promise<SessionScore> {
    // Get session with all round feedbacks
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
        scenario: {
          include: {
            career: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Interview session not found');
    }

    // Build overall assessment prompt
    const messages = this.promptBuilder.buildOverallScoringPrompt(
      session.rounds,
      session.scenario.career.name,
    );

    // Get overall assessment from LLM
    const assessment = await this.llmService.parseJsonResponse<SessionScore>(messages);

    // Validate and clamp score to 0-10 range
    const rawOverall = Number(assessment.overallScore);
    const validatedOverall = Number.isFinite(rawOverall)
      ? Math.min(10, Math.max(0, rawOverall))
      : 0;

    // Ensure assessment has expected structure
    const sessionScore: SessionScore = {
      overallScore: validatedOverall,
      summary: typeof assessment.summary === 'string' ? assessment.summary : 'No summary available',
      strengths: Array.isArray(assessment.strengths) ? assessment.strengths : [],
      weaknesses: Array.isArray(assessment.weaknesses) ? assessment.weaknesses : [],
      readinessLevel: typeof assessment.readinessLevel === 'string' ? assessment.readinessLevel : 'needs_practice',
      topRecommendations: Array.isArray(assessment.topRecommendations) ? assessment.topRecommendations : [],
    };

    // Update session with overall score and feedback
    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        overallScore: sessionScore.overallScore,
        overallFeedback: sessionScore as any,
      },
    });

    return sessionScore;
  }
}
