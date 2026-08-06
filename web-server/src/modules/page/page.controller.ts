import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PageService } from './page.service';
import { CreatePageDto, UpdatePageDto } from './dto/page.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../modules/auth/enums/user-role.enum';

@ApiTags('pages')
@Controller('pages')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all pages including unpublished (admin only)' })
  async findAll() {
    return this.pageService.findAll();
  }

  @Get()
  @ApiOperation({ summary: 'Get all published pages (public)' })
  async findPublished() {
    return this.pageService.findPublished();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a page by slug (public)' })
  @ApiParam({ name: 'slug', example: 'about-us' })
  async findBySlug(@Param('slug') slug: string) {
    return this.pageService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a page (admin only)' })
  async create(@Body() data: CreatePageDto) {
    return this.pageService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a page (admin only)' })
  async update(@Param('id') id: string, @Body() data: UpdatePageDto) {
    return this.pageService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a page (admin only)' })
  async delete(@Param('id') id: string) {
    return this.pageService.delete(id);
  }
}
