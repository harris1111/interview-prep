import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateKnowledgeEntryDto,
  UpdateKnowledgeEntryDto,
  KnowledgeQueryDto,
  ImportResultDto,
} from './dto/knowledge.dto';
import {
  MarkdownParserService,
  ParsedQuestion,
} from './markdown-parser.service';
import { QuestionImporterService } from './question-importer.service';

@Injectable()
export class KnowledgeService {
  constructor(
    private prisma: PrismaService,
    private markdownParser: MarkdownParserService,
    private questionImporter: QuestionImporterService,
  ) {}

  async importFiles(files: Express.Multer.File[]): Promise<ImportResultDto> {
    const result: ImportResultDto = {
      filesProcessed: 0,
      questionsImported: 0,
      knowledgeEntriesCreated: 0,
      errors: [],
    };

    for (const file of files) {
      try {
        const content = file.buffer.toString('utf-8');
        const fileType = this.markdownParser.detectFileType(content);

        if (fileType === 'question-bank') {
          // Parse and import questions
          const parsedQuestions: ParsedQuestion[] =
            this.markdownParser.parseQuestionBank(content, file.originalname);
          const importResult = await this.questionImporter.importQuestions(
            parsedQuestions,
          );
          result.questionsImported += importResult.imported;
        } else {
          // Chunk and create knowledge entries
          const chunks = this.markdownParser.chunkByHeadings(content);
          for (const chunk of chunks) {
            await this.prisma.knowledgeEntry.create({
              data: {
                title: chunk.title,
                content: chunk.content,
                source: file.originalname,
                tags: ['imported'],
              },
            });
            result.knowledgeEntriesCreated++;
          }
        }

        result.filesProcessed++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(
          `Failed to process ${file.originalname}: ${errorMessage}`,
        );
      }
    }

    return result;
  }

  async findAll(query: KnowledgeQueryDto) {
    const { search, careerId, topicSlug, page = 1, limit = 20 } = query;

    const where: any = {};

    if (careerId) {
      where.careerId = careerId;
    }

    if (topicSlug) {
      where.topicSlug = topicSlug;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { content: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.knowledgeEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.knowledgeEntry.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string) {
    const entry = await this.prisma.knowledgeEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Knowledge entry not found');
    }

    return entry;
  }

  async create(dto: CreateKnowledgeEntryDto) {
    return this.prisma.knowledgeEntry.create({
      data: {
        title: dto.title,
        content: dto.content,
        source: dto.source,
        careerId: dto.careerId,
        topicSlug: dto.topicSlug,
        tags: dto.tags || [],
      },
    });
  }

  async update(id: string, dto: UpdateKnowledgeEntryDto) {
    const entry = await this.prisma.knowledgeEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Knowledge entry not found');
    }

    return this.prisma.knowledgeEntry.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.content && { content: dto.content }),
        ...(dto.source !== undefined && { source: dto.source }),
        ...(dto.careerId !== undefined && { careerId: dto.careerId }),
        ...(dto.topicSlug !== undefined && { topicSlug: dto.topicSlug }),
        ...(dto.tags && { tags: dto.tags }),
      },
    });
  }

  async delete(id: string) {
    const entry = await this.prisma.knowledgeEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Knowledge entry not found');
    }

    await this.prisma.knowledgeEntry.delete({ where: { id } });
  }

  async findByTopic(
    topicFocus: string,
    careerId?: string,
    limit: number = 5,
  ): Promise<{ title: string; content: string }[]> {
    // topicFocus can be comma-separated topic names like "JavaScript, React"
    const topicNames = topicFocus
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const where: any = {
      OR: [
        // Match by topicSlug (exact)
        ...topicNames.map((name) => ({
          topicSlug: name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-'),
        })),
        // Match by title containing the topic name
        ...topicNames.map((name) => ({
          title: { contains: name, mode: 'insensitive' as const },
        })),
      ],
    };

    if (careerId) {
      where.careerId = careerId;
    }

    const entries = await this.prisma.knowledgeEntry.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        title: true,
        content: true,
      },
    });

    return entries;
  }
}
