import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AdminService } from './admin.service';
import { PageService } from '../page/page.service';
import { FaqService } from '../faq/faq.service';
import { ContentService, ContentEntry } from '../content/content.service';
import { LandingService } from '../landing/landing.service';
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
    private readonly contentService: ContentService,
    private readonly landingService: LandingService,
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

  @Get('content')
  @ApiOperation({ summary: 'Get all content entries (admin only)' })
  async findAllContent() {
    return this.contentService.findAll();
  }

  @Patch('content/:key')
  @ApiOperation({ summary: 'Update a content entry value' })
  async updateContent(
    @Param('key') key: string,
    @Body('value') value: string,
    @Query('locale') locale?: string,
  ) {
    return this.contentService.update(key, value, locale);
  }

  @Post('content/bulk')
  @ApiOperation({ summary: 'Bulk upsert content entries' })
  async bulkUpsertContent(@Body() dto: { entries: ContentEntry[] }) {
    return this.contentService.bulkUpsert(dto.entries);
  }

  @Post('content')
  @ApiOperation({ summary: 'Create a new content entry' })
  async createContent(@Body() entry: ContentEntry) {
    return this.contentService.upsert(entry);
  }

  @Get('landing-sections')
  @ApiOperation({ summary: 'Get all landing sections (admin only)' })
  async findAllLandingSections() {
    return this.landingService.findAll();
  }

  @Post('landing-sections')
  @ApiOperation({ summary: 'Create a landing section item' })
  async createLandingSection(@Body() data: { section: string; order: number; isActive?: boolean; icon?: string; title?: string; description?: string; name?: string; role?: string; rating?: number; question?: string; answer?: string }) {
    return this.landingService.create(data);
  }

  @Patch('landing-sections/:id')
  @ApiOperation({ summary: 'Update a landing section item' })
  async updateLandingSection(@Param('id') id: string, @Body() data: { section?: string; order?: number; isActive?: boolean; icon?: string; title?: string; description?: string; name?: string; role?: string; rating?: number; question?: string; answer?: string }) {
    return this.landingService.update(id, data);
  }

  @Delete('landing-sections/:id')
  @ApiOperation({ summary: 'Delete a landing section item' })
  async deleteLandingSection(@Param('id') id: string) {
    return this.landingService.delete(id);
  }

  @Patch('landing-sections/:id/reorder')
  @ApiOperation({ summary: 'Reorder a landing section item' })
  async reorderLandingSection(
    @Param('id') id: string,
    @Body() body: { direction: 'up' | 'down' },
  ) {
    await this.landingService.reorder(id, body.direction);
    return this.landingService.findAll();
  }
}
