import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '../schemas/project.schema';

export class CreateProjectDto {
  @ApiProperty({ example: 'Website Redesign' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Complete redesign of company website', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ProjectStatus, default: ProjectStatus.DRAFT, required: false })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiProperty({ type: [String], required: false })
  @IsString({ each: true })
  @IsOptional()
  teamMemberIds?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  budget?: number;
}

export class UpdateProjectDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ProjectStatus, required: false })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiProperty({ type: [String], required: false })
  @IsString({ each: true })
  @IsOptional()
  teamMemberIds?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  budget?: number;
}
