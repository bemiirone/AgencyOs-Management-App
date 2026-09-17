import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LandingService } from './landing.service';
import { CreateLandingSectionDto } from './dto/create-landing-section.dto';
import { UpdateLandingSectionDto } from './dto/update-landing-section.dto';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';

@ApiTags('landing')
@Controller('landing')
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active landing sections (public)' })
  async findActive(@Query('section') section?: string) {
    return this.landingService.findActive(section);
  }
}

@ApiTags('admin/landing-sections')
@Controller('admin/landing-sections')
@UseGuards(AdminJwtAuthGuard)
export class AdminLandingController {
  constructor(private readonly landingService: LandingService) {}

  @Get()
  @ApiOperation({ summary: 'Get all landing sections (admin only)' })
  async findAll() {
    return this.landingService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a landing section item' })
  async create(@Body() data: CreateLandingSectionDto) {
    return this.landingService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a landing section item' })
  async update(@Param('id') id: string, @Body() data: UpdateLandingSectionDto) {
    return this.landingService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a landing section item' })
  async delete(@Param('id') id: string) {
    return this.landingService.delete(id);
  }

  @Patch(':id/reorder')
  @ApiOperation({ summary: 'Reorder a landing section item up or down' })
  async reorder(
    @Param('id') id: string,
    @Body() body: { direction: 'up' | 'down' },
  ) {
    await this.landingService.reorder(id, body.direction);
    return this.landingService.findAll();
  }
}
