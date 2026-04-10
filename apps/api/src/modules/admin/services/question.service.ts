import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionQueryDto } from '../dto/question.dto';

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QuestionQueryDto) {
    const { topicId, difficulty, search, page = 1, limit = 20 } = query;

    const where: any = { isActive: true };

    if (topicId) {
      where.topicId = topicId;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (search) {
      where.content = {
        contains: search,
        mode: 'insensitive' as const,
      };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          topic: {
            select: {
              id: true,
              name: true,
              career: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async create(dto: CreateQuestionDto) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: dto.topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return this.prisma.question.create({
      data: {
        topicId: dto.topicId,
        content: dto.content,
        expectedAnswer: dto.expectedAnswer,
        difficulty: dto.difficulty ?? 'MEDIUM',
        tags: dto.tags ?? [],
      },
    });
  }

  async update(id: string, dto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (dto.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: dto.topicId },
      });
      if (!topic) {
        throw new NotFoundException('Topic not found');
      }
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        ...(dto.topicId && { topicId: dto.topicId }),
        ...(dto.content && { content: dto.content }),
        ...(dto.expectedAnswer !== undefined && { expectedAnswer: dto.expectedAnswer }),
        ...(dto.difficulty && { difficulty: dto.difficulty }),
        ...(dto.tags && { tags: dto.tags }),
      },
    });
  }

  async softDelete(id: string) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.prisma.question.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
