import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTopicDto, UpdateTopicDto } from '../dto/topic.dto';

@Injectable()
export class TopicService {
  constructor(private prisma: PrismaService) {}

  async findAll(careerId?: string) {
    const where = careerId ? { careerId } : {};

    return this.prisma.topic.findMany({
      where,
      orderBy: [{ careerId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        career: {
          select: { id: true, name: true },
        },
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  async create(dto: CreateTopicDto) {
    const career = await this.prisma.career.findUnique({
      where: { id: dto.careerId },
    });

    if (!career) {
      throw new NotFoundException('Career not found');
    }

    const slug = this.generateSlug(dto.name);

    return this.prisma.topic.create({
      data: {
        name: dto.name,
        slug,
        careerId: dto.careerId,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateTopicDto) {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const data: any = {};

    if (dto.name) {
      data.name = dto.name;
      data.slug = this.generateSlug(dto.name);
    }

    if (dto.careerId) {
      const career = await this.prisma.career.findUnique({
        where: { id: dto.careerId },
      });
      if (!career) {
        throw new NotFoundException('Career not found');
      }
      data.careerId = dto.careerId;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }

    return this.prisma.topic.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    await this.prisma.topic.delete({ where: { id } });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
