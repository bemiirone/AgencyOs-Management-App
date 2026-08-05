import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus, BillingType } from '../schemas/invoice.schema';
import { Type } from 'class-transformer';

export class InvoiceLineItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  rate: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

export class PaymentStageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  percentage: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class InvoiceExpenseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  date?: string;
}

export class DateRangeDto {
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clientEmail: string;

  @ApiProperty({ enum: BillingType, default: BillingType.BUDGET })
  @IsEnum(BillingType)
  @IsOptional()
  billingType?: BillingType;

  @ApiProperty({ type: [InvoiceLineItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  @IsOptional()
  lineItems?: InvoiceLineItemDto[];

  @ApiProperty({ type: [PaymentStageDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentStageDto)
  @IsOptional()
  paymentStages?: PaymentStageDto[];

  @ApiProperty({ type: [InvoiceExpenseDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceExpenseDto)
  @IsOptional()
  expenses?: InvoiceExpenseDto[];

  @ApiProperty({ type: DateRangeDto, required: false })
  @ValidateNested()
  @Type(() => DateRangeDto)
  @IsOptional()
  dateRange?: DateRangeDto;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  dailyRate?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  totalHours?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  totalDays?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsNotEmpty()
  subtotal: number;

  @ApiProperty({ required: false })
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

  @ApiProperty({ enum: BillingType, required: false })
  @IsEnum(BillingType)
  @IsOptional()
  billingType?: BillingType;

  @ApiProperty({ type: [InvoiceLineItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  @IsOptional()
  lineItems?: InvoiceLineItemDto[];

  @ApiProperty({ type: [PaymentStageDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentStageDto)
  @IsOptional()
  paymentStages?: PaymentStageDto[];

  @ApiProperty({ type: [InvoiceExpenseDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceExpenseDto)
  @IsOptional()
  expenses?: InvoiceExpenseDto[];

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  tax?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  total?: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class TimeAggregationQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ enum: ['hourly', 'daily'] })
  @IsEnum(['hourly', 'daily'])
  @IsNotEmpty()
  rateType: 'hourly' | 'daily';

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  rate: number;
}
