import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PromptBuilderService } from './prompt-builder.service';
import { ScoringService } from './scoring.service';
import { StartInterviewDto } from './dto/start-interview.dto';
import { SessionStatus, RoundStatus, MessageRole } from '@prisma/client';

@Injectable()
export class InterviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly scoringService: ScoringService,
  ) {}

  async startInterview(userId: string, dto: StartInterviewDto) {
    // Get scenario template with rounds and topics
    const scenario = await this.prisma.scenarioTemplate.findUnique({
      where: { id: dto.scenarioId },
      include: {
        career: true,
        rounds: {
          include: {
            topics: {
              include: {
                topic: true,
              },
            },
          },
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    if (!scenario) {
      throw new NotFoundException('Scenario template not found');
    }

    if (!scenario.isActive) {
      throw new BadRequestException('Scenario is not active');
    }

    // Verify CV analysis if provided
    let cvAnalysis = null;
    if (dto.cvAnalysisId) {
      cvAnalysis = await this.prisma.cvAnalysis.findUnique({
        where: { id: dto.cvAnalysisId },
        include: {
          cvUpload: true,
        },
      });

      if (!cvAnalysis) {
        throw new NotFoundException('CV analysis not found');
      }

      if (cvAnalysis.cvUpload.userId !== userId) {
        throw new ForbiddenException('Not authorized to access this CV analysis');
      }
    }

    // Create interview session
    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        scenarioId: scenario.id,
        status: SessionStatus.DRAFT,
        startedAt: new Date(),
      },
    });

    // Create rounds from template
    for (const roundTemplate of scenario.rounds) {
      const topicNames = roundTemplate.topics
        .map((rt) => rt.topic.name)
        .join(', ');

      await this.prisma.interviewRound.create({
        data: {
          sessionId: session.id,
          roundNumber: roundTemplate.roundNumber,
          topicFocus: topicNames || 'General',
          status: RoundStatus.PENDING,
        },
      });
    }

    // Send initial system message for round 1
    const firstRound = await this.prisma.interviewRound.findUnique({
      where: {
        sessionId_roundNumber: { sessionId: session.id, roundNumber: 1 },
      },
    });

    if (firstRound) {
      const systemPrompt = this.promptBuilder.buildRoundStartPrompt(
        firstRound,
        scenario,
        cvAnalysis ? { structuredData: cvAnalysis.structuredData } : undefined,
      );

      await this.prisma.interviewMessage.create({
        data: {
          roundId: firstRound.id,
          role: MessageRole.SYSTEM,
          content: systemPrompt.content,
        },
      });
    }

    // Return session with rounds
    return this.prisma.interviewSession.findUnique({
      where: { id: session.id },
      include: {
        scenario: {
          include: {
            career: true,
          },
        },
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: {
            _count: {
              select: { messages: true },
            },
          },
        },
      },
    });
  }

  async getSession(id: string, userId: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id },
      include: {
        scenario: {
          include: {
            career: true,
          },
        },
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: {
            _count: {
              select: { messages: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Interview session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this session');
    }

    return session;
  }

  async getMySessions(userId: string) {
    return this.prisma.interviewSession.findMany({
      where: { userId },
      include: {
        scenario: {
          include: {
            career: true,
          },
        },
        _count: {
          select: { rounds: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async abandonSession(id: string, userId: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException('Interview session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this session');
    }

    return this.prisma.interviewSession.update({
      where: { id },
      data: {
        status: SessionStatus.ABANDONED,
        completedAt: new Date(),
      },
    });
  }

  async completeRound(sessionId: string, roundNumber: number, userId: string) {
    // Verify session ownership
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Interview session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this session');
    }

    // Get round
    const round = await this.prisma.interviewRound.findUnique({
      where: {
        sessionId_roundNumber: { sessionId, roundNumber },
      },
    });

    if (!round) {
      throw new NotFoundException('Interview round not found');
    }

    if (round.status === RoundStatus.COMPLETED) {
      throw new BadRequestException('Round is already completed');
    }

    // Use ScoringService to evaluate the round
    await this.scoringService.scoreRound(sessionId, roundNumber);

    // Update round status
    return this.prisma.interviewRound.update({
      where: { id: round.id },
      data: {
        status: RoundStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  async completeInterview(sessionId: string, userId: string) {
    // Verify session ownership
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Interview session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this session');
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Interview is already completed');
    }

    // Ensure all rounds are completed
    const incompletedRounds = session.rounds.filter(
      (r) => r.status !== RoundStatus.COMPLETED,
    );

    if (incompletedRounds.length > 0) {
      throw new BadRequestException(
        `Cannot complete interview: rounds ${incompletedRounds.map((r) => r.roundNumber).join(', ')} are not completed`,
      );
    }

    // Use ScoringService to evaluate the entire session
    await this.scoringService.scoreSession(sessionId);

    // Update session status
    return this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        scenario: {
          include: {
            career: true,
          },
        },
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
      },
    });
  }
}
