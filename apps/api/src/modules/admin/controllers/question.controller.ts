import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { QuestionService } from '../services/question.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionQueryDto } from '../dto/question.dto';

@Controller('admin/questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class QuestionController {
  constructor(private questionService: QuestionService) {}

  @Get()
  async findAll(@Query() query: QuestionQueryDto) {
    return this.questionService.findAll(query);
  }

  @Post()
  async create(@Body() dto: CreateQuestionDto) {
    return this.questionService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.questionService.softDelete(id);
    return { message: 'Question deleted successfully' };
  }
}
