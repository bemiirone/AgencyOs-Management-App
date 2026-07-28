import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus } from '../schemas/invoice.schema';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  tax?: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  timeEntryIds?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  taskIds?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateInvoiceDto {
  @ApiProperty({ enum: InvoiceStatus, required: false })
  @IsString()
  @IsOptional()
  status?: InvoiceStatus;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  tax?: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
