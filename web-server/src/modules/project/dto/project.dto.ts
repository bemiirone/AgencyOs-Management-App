import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '../schemas/project.schema';

export class CreateProjectDto {
  @ApiProperty({ example: 'Website Redesign' })
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @ApiProperty({ example: 'Complete redesign of company website', required: false })
  @IsString()
  @IsOptional()
  declare description?: string;

  @ApiProperty({ enum: ProjectStatus, default: ProjectStatus.DRAFT, required: false })
  @IsEnum(ProjectStatus)
  @IsOptional()
  declare status?: ProjectStatus;

  @ApiProperty({ type: [String], required: false })
  @IsString({ each: true })
  @IsOptional()
  declare teamMemberIds?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare clientId?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  declare startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  declare endDate?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  declare budget?: number;
}

export class UpdateProjectDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare description?: string;

  @ApiProperty({ enum: ProjectStatus, required: false })
  @IsEnum(ProjectStatus)
  @IsOptional()
  declare status?: ProjectStatus;

  @ApiProperty({ type: [String], required: false })
  @IsString({ each: true })
  @IsOptional()
  declare teamMemberIds?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare clientId?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  declare startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  declare endDate?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  declare budget?: number;
}
