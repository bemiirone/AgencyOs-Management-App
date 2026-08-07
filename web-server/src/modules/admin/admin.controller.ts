import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { PageService } from '../page/page.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { CreatePageDto, UpdatePageDto } from '../page/dto/page.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly pageService: PageService,
  ) {}

  @Get('tenants')
  @ApiOperation({ summary: 'Get all tenants (admin only)' })
  async findAllTenants() {
    return this.adminService.findAllTenants();
  }

  @Patch('tenants/:id/status')
  @ApiOperation({ summary: 'Toggle tenant active/inactive status' })
  async toggleTenantStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.adminService.toggleTenantStatus(id, body.isActive);
  }

  @Delete('tenants/:id')
  @ApiOperation({ summary: 'Delete a tenant' })
  async deleteTenant(@Param('id') id: string) {
    return this.adminService.deleteTenant(id);
  }

  @Get('pages')
  @ApiOperation({ summary: 'Get all pages (admin only)' })
  async findAllPages() {
    return this.pageService.findAll();
  }

  @Post('pages')
  @ApiOperation({ summary: 'Create a page' })
  async createPage(@Body() data: CreatePageDto) {
    return this.pageService.create(data);
  }

  @Patch('pages/:id')
  @ApiOperation({ summary: 'Update a page' })
  async updatePage(@Param('id') id: string, @Body() data: UpdatePageDto) {
    return this.pageService.update(id, data);
  }

  @Delete('pages/:id')
  @ApiOperation({ summary: 'Delete a page' })
  async deletePage(@Param('id') id: string) {
    return this.pageService.delete(id);
  }
}
