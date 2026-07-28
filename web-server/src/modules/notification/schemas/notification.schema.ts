import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseDocument } from '../../../common/schemas/base.schema';

export enum NotificationType {
  EMAIL = 'email',
  WEBSOCKET = 'websocket',
  BOTH = 'both',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Notification extends BaseDocument {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: NotificationType, default: NotificationType.WEBSOCKET })
  type: NotificationType;

  @Prop({ required: true, enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Prop()
  sentAt: Date;

  @Prop()
  error: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
