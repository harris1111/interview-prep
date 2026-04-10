import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CareerService } from '../services/career.service';
import { CreateCareerDto, UpdateCareerDto } from '../dto/career.dto';

@Controller('admin/careers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CareerController {
  constructor(private careerService: CareerService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.careerService.findAll(search);
  }

  @Post()
  async create(@Body() dto: CreateCareerDto) {
    return this.careerService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCareerDto) {
    return this.careerService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.careerService.delete(id);
    return { message: 'Career deleted successfully' };
  }
}
