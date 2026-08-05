import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseDocument } from '../../../common/schemas/base.schema';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum BillingType {
  BUDGET = 'budget',
  HOURLY = 'hourly',
  DAILY = 'daily',
  MANUAL = 'manual',
}

export class InvoiceLineItem {
  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  rate: number;

  @Prop({ required: true })
  amount: number;
}

export class PaymentStage {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  percentage: number;

  @Prop()
  dueDate: Date;

  @Prop({ enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Prop()
  paidAt: Date;
}

export class InvoiceExpense {
  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  amount: number;

  @Prop()
  date: Date;
}

export class DateRange {
  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;
}

@Schema({ timestamps: true })
export class Invoice extends BaseDocument {
  @Prop({ required: true })
  declare invoiceNumber: string;

  @Prop({ required: true, enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  declare status: InvoiceStatus;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  declare projectId: string;

  @Prop({ required: true })
  declare clientId: string;

  @Prop({ required: true })
  declare clientName: string;

  @Prop({ required: true })
  declare clientEmail: string;

  @Prop({ enum: BillingType, default: BillingType.BUDGET })
  declare billingType: BillingType;

  @Prop({ type: [Object], default: [] })
  declare lineItems: InvoiceLineItem[];

  @Prop({ type: [Object], default: [] })
  declare paymentStages: PaymentStage[];

  @Prop({ type: [Object], default: [] })
  declare expenses: InvoiceExpense[];

  @Prop()
  declare dateRange: DateRange;

  @Prop()
  declare hourlyRate: number;

  @Prop()
  declare dailyRate: number;

  @Prop()
  declare totalHours: number;

  @Prop()
  declare totalDays: number;

  @Prop({ required: true })
  declare subtotal: number;

  @Prop({ required: true })
  declare amount: number;

  @Prop()
  declare tax: number;

  @Prop()
  declare total: number;

  @Prop()
  declare dueDate: Date;

  @Prop()
  declare paidAt: Date;

  @Prop()
  declare stripePaymentIntentId: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'TimeEntry' }], default: [] })
  declare timeEntryIds: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }], default: [] })
  declare taskIds: string[];

  @Prop()
  declare notes: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
