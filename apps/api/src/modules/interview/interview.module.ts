import { Module } from '@nestjs/common';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { InterviewChatService } from './interview-chat.service';
import { PromptBuilderService } from './prompt-builder.service';

@Module({
  controllers: [InterviewController],
  providers: [
    InterviewService,
    InterviewChatService,
    PromptBuilderService,
  ],
  exports: [InterviewService, InterviewChatService],
})
export class InterviewModule {}
