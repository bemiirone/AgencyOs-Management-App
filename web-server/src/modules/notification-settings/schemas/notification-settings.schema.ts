import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export class NotificationTypeConfig {
  @Prop({ default: true })
  enabled: boolean;

  @Prop({ required: true })
  titleTemplate: string;

  @Prop({ required: true })
  messageTemplate: string;
}

@Schema({ timestamps: true })
export class NotificationSettings extends Document {
  @Prop({ default: true })
  declare enabled: boolean;

  @Prop({ type: Object, default: () => ({ enabled: true, titleTemplate: "Project '{{name}}' due in less than a week", messageTemplate: "The project '{{name}}' has a deadline approaching. Please review progress." }) })
  declare projectDueSoon: NotificationTypeConfig;

  @Prop({ type: Object, default: () => ({ enabled: true, titleTemplate: "Project '{{name}}' is overdue", messageTemplate: "The project '{{name}}' has exceeded its deadline. Immediate attention required." }) })
  declare projectOverdue: NotificationTypeConfig;

  @Prop({ type: Object, default: () => ({ enabled: true, titleTemplate: "Task '{{title}}' due in less than a week", messageTemplate: "The task '{{title}}' has a deadline approaching." }) })
  declare taskDueSoon: NotificationTypeConfig;

  @Prop({ type: Object, default: () => ({ enabled: true, titleTemplate: "Task '{{title}}' is overdue", messageTemplate: "The task '{{title}}' has exceeded its deadline." }) })
  declare taskOverdue: NotificationTypeConfig;

  @Prop()
  declare lastRunAt: Date;

  @Prop()
  declare lastRunStatus: string;

  @Prop({ default: 0 })
  declare lastRunCount: number;
}

export const NotificationSettingsSchema = SchemaFactory.createForClass(NotificationSettings);
