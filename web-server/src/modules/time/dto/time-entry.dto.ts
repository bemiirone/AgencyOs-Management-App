import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';

export class CreateTimeEntryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare projectId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare taskId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare description?: string;

  @ApiProperty({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  declare isBillable?: boolean;

  @ApiProperty({ enum: ['automatic', 'manual'], default: 'automatic', required: false })
  @IsEnum(['automatic', 'manual'])
  @IsOptional()
  declare calculationMode?: 'automatic' | 'manual';
}

export class UpdateTimeEntryDto extends PartialType(CreateTimeEntryDto) {
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  declare startTime?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  declare endTime?: string;
}
