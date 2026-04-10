import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InterviewService } from './interview.service';
import { InterviewChatService } from './interview-chat.service';
import { StartInterviewDto } from './dto/start-interview.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('interview')
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(
    private readonly interviewService: InterviewService,
    private readonly interviewChatService: InterviewChatService,
  ) {}

  @Post('start')
  async startInterview(
    @CurrentUser() user: any,
    @Body() dto: StartInterviewDto,
  ) {
    return this.interviewService.startInterview(user.id, dto);
  }

  @Get('my')
  async getMySessions(@CurrentUser() user: any) {
    return this.interviewService.getMySessions(user.id);
  }

  @Get(':id')
  async getSession(@Param('id') id: string, @CurrentUser() user: any) {
    return this.interviewService.getSession(id, user.id);
  }

  @Delete(':id')
  async abandonSession(@Param('id') id: string, @CurrentUser() user: any) {
    return this.interviewService.abandonSession(id, user.id);
  }

  @Post(':id/rounds/:roundNumber/message')
  async sendMessage(
    @Param('id') id: string,
    @Param('roundNumber', ParseIntPipe) roundNumber: number,
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.interviewChatService.saveUserMessage(
      id,
      roundNumber,
      dto.content,
      user.id,
    );
  }

  @Get(':id/rounds/:roundNumber/messages')
  async getMessages(
    @Param('id') id: string,
    @Param('roundNumber', ParseIntPipe) roundNumber: number,
    @CurrentUser() user: any,
  ) {
    return this.interviewChatService.getMessages(id, roundNumber, user.id);
  }

  @Post(':id/rounds/:roundNumber/complete')
  async completeRound(
    @Param('id') id: string,
    @Param('roundNumber', ParseIntPipe) roundNumber: number,
    @CurrentUser() user: any,
  ) {
    return this.interviewService.completeRound(id, roundNumber, user.id);
  }

  @Post(':id/complete')
  async completeInterview(@Param('id') id: string, @CurrentUser() user: any) {
    return this.interviewService.completeInterview(id, user.id);
  }

  @Post(':id/rounds/:roundNumber/stream')
  async stream(
    @Param('id') id: string,
    @Param('roundNumber', ParseIntPipe) roundNumber: number,
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let clientDisconnected = false;
    req.on('close', () => {
      clientDisconnected = true;
    });

    try {
      // Save user message first
      await this.interviewChatService.saveUserMessage(
        id,
        roundNumber,
        dto.content,
        user.id,
      );

      // Stream LLM response
      const stream = this.interviewChatService.streamResponse(
        id,
        roundNumber,
        user.id,
      );
      let fullContent = '';

      for await (const chunk of stream) {
        fullContent += chunk;
        if (clientDisconnected) break;
        try {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        } catch {
          // Client disconnected during write
          break;
        }
      }

      // Save assistant message (even partial on disconnect)
      if (fullContent) {
        await this.interviewChatService.saveAssistantMessage(
          id,
          roundNumber,
          fullContent,
        );
      }

      if (!clientDisconnected) {
        res.write('data: [DONE]\n\n');
      }
      res.end();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!clientDisconnected) {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      }
      res.end();
    }
  }
}
