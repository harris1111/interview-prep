import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UserManagementService } from '../services/user-management.service';
import { UserQueryDto, UpdateUserRoleDto } from '../dto/user-management.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UserManagementController {
  constructor(private userManagementService: UserManagementService) {}

  @Get()
  async findAll(@Query() query: UserQueryDto) {
    return this.userManagementService.findAll(query);
  }

  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.userManagementService.updateRole(id, dto.role);
  }
}
