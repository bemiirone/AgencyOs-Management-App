import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FaqItem } from './schemas/faq.schema';

class CreateFaqDto {
  title: string;
  items: FaqItem[];
  order: number;
}

class UpdateFaqDto {
  title?: string;
  items?: FaqItem[];
  order?: number;
}

@ApiTags('faq')
@Controller('faq')
@UseGuards(JwtAuthGuard)
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  @ApiOperation({ summary: 'Get all FAQ headings' })
  async findAll() {
    return this.faqService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new FAQ heading' })
  async create(@Body() data: CreateFaqDto) {
    return this.faqService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an FAQ heading' })
  async update(@Param('id') id: string, @Body() data: UpdateFaqDto) {
    return this.faqService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an FAQ heading' })
  async delete(@Param('id') id: string) {
    return this.faqService.delete(id);
  }
}
