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
