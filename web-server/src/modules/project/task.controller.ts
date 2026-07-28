import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TaskStatus } from './schemas/task.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async create(@Body() createTaskDto: CreateTaskDto, @TenantId() tenantId: string) {
    return this.taskService.create(createTaskDto, tenantId);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get tasks by project' })
  async findByProject(
    @Param('projectId') projectId: string,
    @TenantId() tenantId: string,
    @Query('status') status?: TaskStatus,
  ) {
    return this.taskService.findByProject(projectId, tenantId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.taskService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.update(id, tenantId, updateTaskDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update task status' })
  async updateStatus(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('status') status: TaskStatus,
  ) {
    return this.taskService.updateStatus(id, tenantId, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.taskService.remove(id, tenantId);
  }
}
