import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { MarkdownParserService } from './markdown-parser.service';
import { QuestionImporterService } from './question-importer.service';

@Module({
  imports: [PrismaModule],
  controllers: [KnowledgeController],
  providers: [
    KnowledgeService,
    MarkdownParserService,
    QuestionImporterService,
  ],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
