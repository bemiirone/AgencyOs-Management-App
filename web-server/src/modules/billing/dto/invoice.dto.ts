import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus } from '../schemas/invoice.schema';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare projectId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare clientId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  declare amount: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  declare tax?: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  declare dueDate?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  declare timeEntryIds?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  declare taskIds?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare notes?: string;
}

export class UpdateInvoiceDto {
  @ApiProperty({ enum: InvoiceStatus, required: false })
  @IsString()
  @IsOptional()
  declare status?: InvoiceStatus;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  declare amount?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  declare tax?: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  declare dueDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare notes?: string;
}
