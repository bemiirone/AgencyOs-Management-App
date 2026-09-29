import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, IsEnum, IsIn, Min, Max } from 'class-validator';
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

  @ApiProperty({ required: false, default: 8 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(24)
  declare workDayHours?: number;

  @ApiProperty({ required: false, default: 1.5 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  declare overtimeRate?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  declare overtimeHours?: number;

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

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  declare subtotal?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  declare amount?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  declare overtimeHours?: number;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  declare timeEntryIds?: string[];
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

export class TimeEntryCalculationOptionsDto {
  @ApiProperty({ required: false, default: 8, description: 'Working day length in hours (1-24)' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(24)
  declare workDayHours?: number;

  @ApiProperty({ required: false, default: 1.5, description: 'Overtime rate multiplier (e.g., 1.5 for time-and-a-half)' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  declare overtimeRate?: number;
}

export class CalculateTimeEntriesDto {
  @ApiProperty({ type: [String], description: 'Array of time entry IDs to calculate' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  declare timeEntryIds: string[];

  @ApiProperty({ enum: ['hourly', 'daily'] })
  @IsEnum(['hourly', 'daily'])
  @IsNotEmpty()
  declare rateType: 'hourly' | 'daily';

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  declare hourlyRate?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  declare dailyRate?: number;

  @ApiProperty({ required: false })
  @ValidateNested()
  @Type(() => TimeEntryCalculationOptionsDto)
  @IsOptional()
  declare calculationOptions?: TimeEntryCalculationOptionsDto;
}
