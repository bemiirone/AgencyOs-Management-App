import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TimeEntryService } from './time-entry.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from './dto/time-entry.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('time-entries')
@Controller('time-entries')
@UseGuards(JwtAuthGuard)
export class TimeEntryController {
  constructor(private readonly timeEntryService: TimeEntryService) {}

  @Post()
  @ApiOperation({ summary: 'Start a new time entry' })
  async startTimer(
    @Body() createTimeEntryDto: CreateTimeEntryDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.timeEntryService.create(createTimeEntryDto, tenantId, user.userId);
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop a running time entry' })
  async stopTimer(@Param('id') id: string, @TenantId() tenantId: string, @CurrentUser() user: any) {
    return this.timeEntryService.stop(id, tenantId, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all time entries' })
  async findAll(@TenantId() tenantId: string, @Query('userId') userId?: string) {
    return this.timeEntryService.findAll(tenantId, userId);
  }

  @Get('running')
  @ApiOperation({ summary: 'Get current running time entry' })
  async getRunning(@TenantId() tenantId: string, @CurrentUser() user: any) {
    return this.timeEntryService.getRunningEntry(tenantId, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get time entry by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.timeEntryService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update time entry' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() updateTimeEntryDto: UpdateTimeEntryDto,
  ) {
    return this.timeEntryService.update(id, tenantId, user.userId, updateTimeEntryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete time entry' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string, @CurrentUser() user: any) {
    return this.timeEntryService.remove(id, tenantId, user.userId);
  }
}
