import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new tenant workspace' })
  async create(@Body() createTenantDto: CreateTenantDto, @CurrentUser() user: any) {
    return this.tenantService.create(createTenantDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants for current user' })
  async findAll(@CurrentUser() user: any) {
    return this.tenantService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.tenantService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update tenant' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() updateData: Partial<CreateTenantDto>,
  ) {
    return this.tenantService.update(id, tenantId, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete tenant' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.tenantService.remove(id, tenantId);
  }
}
