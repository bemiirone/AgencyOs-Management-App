import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}

export class UpdateTimeEntryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare taskId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare projectId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare description?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  declare isBillable?: boolean;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  declare startTime?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  declare endTime?: string;
}
