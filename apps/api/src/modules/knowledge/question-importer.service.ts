import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ParsedQuestion } from './markdown-parser.service';
import * as crypto from 'crypto';

@Injectable()
export class QuestionImporterService {
  constructor(private prisma: PrismaService) {}

  async importQuestions(
    parsedQuestions: ParsedQuestion[],
    careerId?: string,
  ): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;

    // Get all topics for this career
    const topics = await this.prisma.topic.findMany({
      where: careerId ? { careerId } : {},
    });

    const topicMap = new Map<string, string>();
    topics.forEach((topic) => {
      topicMap.set(topic.name.toLowerCase(), topic.id);
    });

    // Get existing question hashes to avoid duplicates
    const existingQuestions = await this.prisma.question.findMany({
      select: { content: true },
    });

    const existingHashes = new Set(
      existingQuestions.map((q) => this.hashContent(q.content)),
    );

    for (const parsed of parsedQuestions) {
      const contentHash = this.hashContent(parsed.question);

      // Skip if duplicate
      if (existingHashes.has(contentHash)) {
        skipped++;
        continue;
      }

      // Find matching topic
      const topicId = topicMap.get(parsed.topicName.toLowerCase());
      if (!topicId) {
        skipped++;
        continue;
      }

      try {
        await this.prisma.question.create({
          data: {
            topicId,
            content: parsed.question,
            expectedAnswer: parsed.answer,
            difficulty: parsed.difficulty,
            isActive: true,
          },
        });
        imported++;
        existingHashes.add(contentHash);
      } catch (error) {
        skipped++;
      }
    }

    return { imported, skipped };
  }

  private hashContent(content: string): string {
    return crypto
      .createHash('md5')
      .update(content.toLowerCase().trim())
      .digest('hex');
  }
}
