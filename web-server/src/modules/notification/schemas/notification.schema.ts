import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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
  declare userId: string;

  @Prop({ required: true })
  declare title: string;

  @Prop({ required: true })
  declare message: string;

  @Prop({ required: true, enum: NotificationType, default: NotificationType.WEBSOCKET })
  declare type: NotificationType;

  @Prop({ required: true, enum: NotificationStatus, default: NotificationStatus.PENDING })
  declare status: NotificationStatus;

  @Prop()
  declare sentAt: Date;

  @Prop()
  declare error: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
