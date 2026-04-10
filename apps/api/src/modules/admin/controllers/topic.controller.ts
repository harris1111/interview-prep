import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { TopicService } from '../services/topic.service';
import { CreateTopicDto, UpdateTopicDto } from '../dto/topic.dto';

@Controller('admin/topics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class TopicController {
  constructor(private topicService: TopicService) {}

  @Get()
  async findAll(@Query('careerId') careerId?: string) {
    return this.topicService.findAll(careerId);
  }

  @Post()
  async create(@Body() dto: CreateTopicDto) {
    return this.topicService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTopicDto) {
    return this.topicService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.topicService.delete(id);
    return { message: 'Topic deleted successfully' };
  }
}
