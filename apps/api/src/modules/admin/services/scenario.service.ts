import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScenarioDto, UpdateScenarioDto } from '../dto/scenario.dto';

@Injectable()
export class ScenarioService {
  constructor(private prisma: PrismaService) {}

  async findAll(careerId?: string) {
    const where = careerId ? { careerId } : {};

    return this.prisma.scenarioTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        career: {
          select: { id: true, name: true },
        },
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: {
            topics: {
              include: {
                topic: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const scenario = await this.prisma.scenarioTemplate.findUnique({
      where: { id },
      include: {
        career: {
          select: { id: true, name: true },
        },
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: {
            topics: {
              include: {
                topic: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        },
      },
    });

    if (!scenario) {
      throw new NotFoundException('Scenario not found');
    }

    return scenario;
  }

  async create(dto: CreateScenarioDto) {
    const career = await this.prisma.career.findUnique({
      where: { id: dto.careerId },
    });

    if (!career) {
      throw new NotFoundException('Career not found');
    }

    // Validate all topic IDs exist
    const topicIds = dto.rounds.flatMap((r) => r.topicIds);
    const uniqueTopicIds = [...new Set(topicIds)];

    const topics = await this.prisma.topic.findMany({
      where: { id: { in: uniqueTopicIds } },
    });

    if (topics.length !== uniqueTopicIds.length) {
      throw new BadRequestException('One or more topics not found');
    }

    // Create scenario with rounds in transaction
    const scenarioId = await this.prisma.$transaction(async (tx) => {
      const scenario = await tx.scenarioTemplate.create({
        data: {
          name: dto.name,
          careerId: dto.careerId,
          description: dto.description,
        },
      });

      for (const roundDto of dto.rounds) {
        const round = await tx.roundTemplate.create({
          data: {
            scenarioId: scenario.id,
            roundNumber: roundDto.roundNumber,
            name: roundDto.name,
            description: roundDto.description,
            durationMinutes: roundDto.durationMinutes ?? 30,
            questionCount: roundDto.questionCount ?? 5,
            difficulty: roundDto.difficulty ?? 'MEDIUM',
          },
        });

        // Create round-topic associations
        for (const topicId of roundDto.topicIds) {
          await tx.roundTemplateTopic.create({
            data: {
              roundId: round.id,
              topicId,
              weight: 1,
            },
          });
        }
      }

      return scenario.id;
    });

    return this.findOne(scenarioId);
  }

  async update(id: string, dto: UpdateScenarioDto) {
    const scenario = await this.prisma.scenarioTemplate.findUnique({
      where: { id },
    });

    if (!scenario) {
      throw new NotFoundException('Scenario not found');
    }

    if (dto.careerId) {
      const career = await this.prisma.career.findUnique({
        where: { id: dto.careerId },
      });
      if (!career) {
        throw new NotFoundException('Career not found');
      }
    }

    const data: any = {};

    if (dto.name) data.name = dto.name;
    if (dto.careerId) data.careerId = dto.careerId;
    if (dto.description !== undefined) data.description = dto.description;

    await this.prisma.scenarioTemplate.update({
      where: { id },
      data,
    });

    // If rounds are provided, replace all rounds
    if (dto.rounds && dto.rounds.length > 0) {
      const topicIds = dto.rounds.flatMap((r) => r.topicIds);
      const uniqueTopicIds = [...new Set(topicIds)];

      const topics = await this.prisma.topic.findMany({
        where: { id: { in: uniqueTopicIds } },
      });

      if (topics.length !== uniqueTopicIds.length) {
        throw new BadRequestException('One or more topics not found');
      }

      await this.prisma.$transaction(async (tx) => {
        // Delete existing rounds (cascade will delete topics)
        await tx.roundTemplate.deleteMany({
          where: { scenarioId: id },
        });

        // Create new rounds
        for (const roundDto of dto.rounds!) {
          const round = await tx.roundTemplate.create({
            data: {
              scenarioId: id,
              roundNumber: roundDto.roundNumber,
              name: roundDto.name,
              description: roundDto.description,
              durationMinutes: roundDto.durationMinutes ?? 30,
              questionCount: roundDto.questionCount ?? 5,
              difficulty: roundDto.difficulty ?? 'MEDIUM',
            },
          });

          for (const topicId of roundDto.topicIds) {
            await tx.roundTemplateTopic.create({
              data: {
                roundId: round.id,
                topicId,
                weight: 1,
              },
            });
          }
        }
      });
    }

    return this.findOne(id);
  }

  async delete(id: string) {
    const scenario = await this.prisma.scenarioTemplate.findUnique({
      where: { id },
    });

    if (!scenario) {
      throw new NotFoundException('Scenario not found');
    }

    await this.prisma.scenarioTemplate.delete({ where: { id } });
  }
}
