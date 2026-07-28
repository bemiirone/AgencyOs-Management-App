import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '../schemas/task.schema';

export class CreateTaskDto {
  @ApiProperty({ example: 'Design homepage mockup' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: TaskStatus, default: TaskStatus.TODO, required: false })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiProperty({ enum: TaskPriority, default: TaskPriority.MEDIUM, required: false })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ type: [String], required: false })
  @IsString({ each: true })
  @IsOptional()
  assigneeIds?: string[];

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  parentTaskId?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  order?: number;
}

export class UpdateTaskDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: TaskStatus, required: false })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiProperty({ enum: TaskPriority, required: false })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({ type: [String], required: false })
  @IsString({ each: true })
  @IsOptional()
  assigneeIds?: string[];

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  parentTaskId?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  order?: number;
}
