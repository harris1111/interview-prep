import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService, ChatMessage } from '../llm/llm.service';
import { PromptBuilderService } from './prompt-builder.service';
import { MessageRole, RoundStatus } from '@prisma/client';

@Injectable()
export class InterviewChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
    private readonly promptBuilder: PromptBuilderService,
  ) {}

  async saveUserMessage(
    sessionId: string,
    roundNumber: number,
    content: string,
    userId: string,
  ) {
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

    // Update round status to IN_PROGRESS if PENDING
    if (round.status === RoundStatus.PENDING) {
      await this.prisma.interviewRound.update({
        where: { id: round.id },
        data: {
          status: RoundStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });
    }

    // Save user message
    return this.prisma.interviewMessage.create({
      data: {
        roundId: round.id,
        role: MessageRole.USER,
        content,
      },
    });
  }

  async saveAssistantMessage(
    sessionId: string,
    roundNumber: number,
    content: string,
  ) {
    const round = await this.prisma.interviewRound.findUnique({
      where: {
        sessionId_roundNumber: { sessionId, roundNumber },
      },
    });

    if (!round) {
      throw new NotFoundException('Interview round not found');
    }

    // Extract score and feedback from content if present
    const scoreMatch = content.match(/\[SCORE:(\d+)\]/);
    const feedbackMatch = content.match(/\[FEEDBACK:(.*?)\]/s);

    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : null;

    return this.prisma.interviewMessage.create({
      data: {
        roundId: round.id,
        role: MessageRole.ASSISTANT,
        content,
        score,
        feedback,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  async *streamResponse(
    sessionId: string,
    roundNumber: number,
    userId: string,
  ): AsyncGenerator<string> {
    // Verify session ownership
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
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

    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this session');
    }

    // Get round with messages
    const round = await this.prisma.interviewRound.findUnique({
      where: {
        sessionId_roundNumber: { sessionId, roundNumber },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!round) {
      throw new NotFoundException('Interview round not found');
    }

    // Build messages array for LLM
    const llmMessages: ChatMessage[] = [];

    // If this is the first message of the round, add system prompt
    if (round.messages.length === 0 || round.messages[0].role !== MessageRole.SYSTEM) {
      const systemPrompt = this.promptBuilder.buildRoundStartPrompt(
        round,
        session.scenario,
      );
      llmMessages.push(systemPrompt);
    }

    // Add conversation history with context management
    const messagesToInclude = this.manageContext(round.messages);
    const followUpMessages = this.promptBuilder.buildFollowUpMessages(messagesToInclude);
    llmMessages.push(...followUpMessages);

    // Stream from LLM
    const stream = this.llmService.streamChatCompletion(llmMessages);
    for await (const chunk of stream) {
      yield chunk;
    }
  }

  async getMessages(sessionId: string, roundNumber: number, userId: string) {
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

    // Get round with messages
    const round = await this.prisma.interviewRound.findUnique({
      where: {
        sessionId_roundNumber: { sessionId, roundNumber },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!round) {
      throw new NotFoundException('Interview round not found');
    }

    return round.messages;
  }

  /**
   * Context management: if messages > 10, summarize older ones
   */
  private manageContext(messages: any[]): any[] {
    const MAX_MESSAGES = 10;

    if (messages.length <= MAX_MESSAGES) {
      return messages;
    }

    // Keep the first message (usually system) and the last MAX_MESSAGES messages
    const systemMessage = messages.find((m) => m.role === MessageRole.SYSTEM);
    const recentMessages = messages.slice(-MAX_MESSAGES);

    if (systemMessage && recentMessages[0]?.id !== systemMessage.id) {
      return [systemMessage, ...recentMessages];
    }

    return recentMessages;
  }
}
