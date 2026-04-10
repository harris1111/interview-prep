import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCareerDto, UpdateCareerDto } from '../dto/career.dto';

@Injectable()
export class CareerService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.career.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { topics: true, scenarios: true },
        },
      },
    });
  }

  async create(dto: CreateCareerDto) {
    const slug = this.generateSlug(dto.name);

    const existing = await this.prisma.career.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Career with this name already exists');
    }

    return this.prisma.career.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
      },
    });
  }

  async update(id: string, dto: UpdateCareerDto) {
    const career = await this.prisma.career.findUnique({ where: { id } });
    if (!career) {
      throw new NotFoundException('Career not found');
    }

    const data: any = {};

    if (dto.name) {
      data.name = dto.name;
      data.slug = this.generateSlug(dto.name);
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    return this.prisma.career.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const career = await this.prisma.career.findUnique({ where: { id } });
    if (!career) {
      throw new NotFoundException('Career not found');
    }

    // Check for dependent data before cascade delete
    const [topicCount, scenarioCount, sessionCount] = await Promise.all([
      this.prisma.topic.count({ where: { careerId: id } }),
      this.prisma.scenarioTemplate.count({ where: { careerId: id } }),
      this.prisma.interviewSession.count({
        where: { scenario: { careerId: id } },
      }),
    ]);

    if (sessionCount > 0) {
      throw new ConflictException(
        `Cannot delete career with ${sessionCount} active interview session(s). ` +
          'Delete associated sessions first.',
      );
    }

    if (scenarioCount > 0 || topicCount > 0) {
      throw new ConflictException(
        `Career has ${topicCount} topic(s) and ${scenarioCount} scenario(s). ` +
          'Delete associated topics and scenarios first.',
      );
    }

    await this.prisma.career.delete({ where: { id } });
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
