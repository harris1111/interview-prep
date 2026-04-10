import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ScenarioService } from '../services/scenario.service';
import { CreateScenarioDto, UpdateScenarioDto } from '../dto/scenario.dto';

@Controller('admin/scenarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ScenarioController {
  constructor(private scenarioService: ScenarioService) {}

  @Get()
  async findAll(@Query('careerId') careerId?: string) {
    return this.scenarioService.findAll(careerId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.scenarioService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateScenarioDto) {
    return this.scenarioService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateScenarioDto) {
    return this.scenarioService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.scenarioService.delete(id);
    return { message: 'Scenario deleted successfully' };
  }
}
