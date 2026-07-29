import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTimeEntryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  taskId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isBillable?: boolean;
}

export class UpdateTimeEntryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  taskId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isBillable?: boolean;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endTime?: string;
}
