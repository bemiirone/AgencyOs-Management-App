import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseDocument } from '../../../common/schemas/base.schema';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Invoice extends BaseDocument {
  @Prop({ required: true })
  invoiceNumber: string;

  @Prop({ required: true, enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: string;

  @Prop({ required: true })
  clientId: string;

  @Prop({ required: true })
  amount: number;

  @Prop()
  tax: number;

  @Prop()
  total: number;

  @Prop()
  dueDate: Date;

  @Prop()
  paidAt: Date;

  @Prop()
  stripePaymentIntentId: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'TimeEntry' }], default: [] })
  timeEntryIds: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }], default: [] })
  taskIds: string[];

  @Prop()
  notes: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
