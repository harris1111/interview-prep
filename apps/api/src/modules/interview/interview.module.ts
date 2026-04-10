import { Module } from '@nestjs/common';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { InterviewChatService } from './interview-chat.service';
import { PromptBuilderService } from './prompt-builder.service';
import { ScoringService } from './scoring.service';
import { KnowledgeModule } from '../knowledge/knowledge.module';

@Module({
  imports: [KnowledgeModule],
  controllers: [InterviewController],
  providers: [
    InterviewService,
    InterviewChatService,
    PromptBuilderService,
    ScoringService,
  ],
  exports: [InterviewService, InterviewChatService],
})
export class InterviewModule {}
