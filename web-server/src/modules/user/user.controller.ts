import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UpdateRoleDto } from './dto/user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users in current tenant' })
  async findAll(@TenantId() tenantId: string) {
    return this.userService.findAll(tenantId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.userService.findOne(id, tenantId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user in current tenant' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @TenantId() tenantId: string,
  ) {
    return this.userService.create(createUserDto, tenantId, createUserDto.role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, tenantId, updateUserDto);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user role' })
  async updateRole(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.userService.update(id, tenantId, { role: updateRoleDto.role });
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete user' })
  async softDelete(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.userService.softDelete(id, tenantId);
  }

  @Patch(':id/reactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reactivate soft-deleted user' })
  async reactivate(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.userService.reactivate(id, tenantId);
  }
}
