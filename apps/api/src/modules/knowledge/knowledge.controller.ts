import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { KnowledgeService } from './knowledge.service';
import {
  CreateKnowledgeEntryDto,
  UpdateKnowledgeEntryDto,
  KnowledgeQueryDto,
} from './dto/knowledge.dto';

@Controller('admin/knowledge')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) {}

  @Post('import')
  @UseInterceptors(FilesInterceptor('files', 20, { limits: { fileSize: 5 * 1024 * 1024 } }))
  async importFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return this.knowledgeService.importFiles(files);
  }

  @Get()
  async findAll(@Query() query: KnowledgeQueryDto) {
    return this.knowledgeService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.knowledgeService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateKnowledgeEntryDto) {
    return this.knowledgeService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateKnowledgeEntryDto) {
    return this.knowledgeService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.knowledgeService.delete(id);
    return { message: 'Knowledge entry deleted successfully' };
  }
}
