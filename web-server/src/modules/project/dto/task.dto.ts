import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '../schemas/task.schema';

export class CreateTaskDto {
  @ApiProperty({ example: 'Design homepage mockup' })
  @IsString()
  @IsNotEmpty()
  declare title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare description?: string;

  @ApiProperty({ enum: TaskStatus, default: TaskStatus.TODO, required: false })
  @IsEnum(TaskStatus)
  @IsOptional()
  declare status?: TaskStatus;

  @ApiProperty({ enum: TaskPriority, default: TaskPriority.MEDIUM, required: false })
  @IsEnum(TaskPriority)
  @IsOptional()
  declare priority?: TaskPriority;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare projectId: string;

  @ApiProperty({ type: [String], required: false })
  @IsString({ each: true })
  @IsOptional()
  declare assigneeIds?: string[];

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  declare dueDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare parentTaskId?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  declare order?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare createdBy?: string;
}

export class UpdateTaskDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare description?: string;

  @ApiProperty({ enum: TaskStatus, required: false })
  @IsEnum(TaskStatus)
  @IsOptional()
  declare status?: TaskStatus;

  @ApiProperty({ enum: TaskPriority, required: false })
  @IsEnum(TaskPriority)
  @IsOptional()
  declare priority?: TaskPriority;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare projectId?: string;

  @ApiProperty({ type: [String], required: false })
  @IsString({ each: true })
  @IsOptional()
  declare assigneeIds?: string[];

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  declare dueDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare parentTaskId?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  declare order?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare createdBy?: string;
}
