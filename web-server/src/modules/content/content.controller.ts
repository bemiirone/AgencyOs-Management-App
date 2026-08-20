import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContentService, ContentEntry } from './content.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';

class BulkUpsertDto {
  entries: ContentEntry[];
}

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all content entries' })
  async findAll(@Query('locale') locale?: string) {
    return this.contentService.findAll(locale);
  }

  @Get(':category')
  @ApiOperation({ summary: 'Get content entries by category' })
  async findByCategory(@Param('category') category: string, @Query('locale') locale?: string) {
    return this.contentService.findByCategory(category, locale);
  }

  @Post()
  @UseGuards(AdminJwtAuthGuard)
  @ApiOperation({ summary: 'Create or update a content entry' })
  async upsert(@Body() entry: ContentEntry) {
    return this.contentService.upsert(entry);
  }

  @Post('bulk')
  @UseGuards(AdminJwtAuthGuard)
  @ApiOperation({ summary: 'Bulk upsert content entries' })
  async bulkUpsert(@Body() dto: BulkUpsertDto) {
    return this.contentService.bulkUpsert(dto.entries);
  }

  @Patch(':key')
  @UseGuards(AdminJwtAuthGuard)
  @ApiOperation({ summary: 'Update a content entry value' })
  async update(
    @Param('key') key: string,
    @Body('value') value: string,
    @Query('locale') locale?: string,
  ) {
    return this.contentService.update(key, value, locale);
  }

  @Delete(':key')
  @UseGuards(AdminJwtAuthGuard)
  @ApiOperation({ summary: 'Delete a content entry' })
  async delete(@Param('key') key: string, @Query('locale') locale?: string) {
    return this.contentService.delete(key, locale);
  }
}
