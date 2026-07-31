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
