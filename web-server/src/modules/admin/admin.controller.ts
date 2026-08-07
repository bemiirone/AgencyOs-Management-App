import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AdminService } from './admin.service';
import { PageService } from '../page/page.service';
import { FaqService } from '../faq/faq.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { CreatePageDto, UpdatePageDto } from '../page/dto/page.dto';

class FaqItemDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;

  @IsNumber()
  order: number;
}

export class CreateFaqDto {
  @IsString()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  items: FaqItemDto[];

  @IsNumber()
  order: number;
}

export class UpdateFaqDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  items?: FaqItemDto[];

  @IsOptional()
  @IsNumber()
  order?: number;
}

@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly pageService: PageService,
    private readonly faqService: FaqService,
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

  @Get('faqs')
  @ApiOperation({ summary: 'Get all FAQ groups (admin only)' })
  async findAllFaqs() {
    return this.faqService.findAll();
  }

  @Post('faqs')
  @ApiOperation({ summary: 'Create an FAQ group' })
  async createFaq(@Body() data: CreateFaqDto) {
    return this.faqService.create(data);
  }

  @Patch('faqs/:id')
  @ApiOperation({ summary: 'Update an FAQ group' })
  async updateFaq(@Param('id') id: string, @Body() data: UpdateFaqDto) {
    return this.faqService.update(id, data);
  }

  @Delete('faqs/:id')
  @ApiOperation({ summary: 'Delete an FAQ group' })
  async deleteFaq(@Param('id') id: string) {
    return this.faqService.delete(id);
  }
}
