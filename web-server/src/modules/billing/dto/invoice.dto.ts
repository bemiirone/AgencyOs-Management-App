import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus, BillingType } from '../schemas/invoice.schema';
import { Type } from 'class-transformer';
import { OmitType, PartialType } from '@nestjs/mapped-types';

class InvoiceLineItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare description: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  declare quantity: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  declare rate: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  declare amount: number;
}

class InvoiceExpenseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare description: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  declare amount: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  declare date?: string;
}

class DateRangeDto {
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  declare startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  declare endDate?: string;
}

class BaseInvoiceDto {
  @ApiProperty({ enum: BillingType, default: BillingType.BUDGET })
  @IsEnum(BillingType)
  @IsOptional()
  declare billingType?: BillingType;

  @ApiProperty({ type: [InvoiceLineItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  @IsOptional()
  declare lineItems?: InvoiceLineItemDto[];

  @ApiProperty({ type: [InvoiceExpenseDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceExpenseDto)
  @IsOptional()
  declare expenses?: InvoiceExpenseDto[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare taskId?: string;

  @ApiProperty({ type: DateRangeDto, required: false })
  @ValidateNested()
  @Type(() => DateRangeDto)
  @IsOptional()
  declare dateRange?: DateRangeDto;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  declare hourlyRate?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  declare dailyRate?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  declare totalHours?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  declare totalDays?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsNotEmpty()
  declare subtotal: number;

  @ApiProperty({ required: false })
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

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare notes?: string;
}

class BaseInvoiceUpdateDto extends BaseInvoiceDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  declare total?: number;
}

export class CreateInvoiceDto extends BaseInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare projectId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  declare clientId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare clientName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare clientEmail: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  declare timeEntryIds?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  declare taskIds?: string[];
}

export class UpdateInvoiceDto extends PartialType(BaseInvoiceUpdateDto) {
  @ApiProperty({ enum: InvoiceStatus, required: false })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  declare status?: InvoiceStatus;
}

export class TimeAggregationQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare projectId: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  declare startDate: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  declare endDate: string;

  @ApiProperty({ enum: ['hourly', 'daily'] })
  @IsEnum(['hourly', 'daily'])
  @IsNotEmpty()
  declare rateType: 'hourly' | 'daily';

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  declare rate: number;
}
