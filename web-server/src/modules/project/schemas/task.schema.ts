import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseDocument } from '../../../common/schemas/base.schema';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Schema({ timestamps: true })
export class Task extends BaseDocument {
  @Prop({ required: true })
  declare title: string;

  @Prop()
  declare description: string;

  @Prop({ required: true, enum: TaskStatus, default: TaskStatus.TODO })
  declare status: TaskStatus;

  @Prop({ required: true, enum: TaskPriority, default: TaskPriority.MEDIUM })
  declare priority: TaskPriority;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  declare projectId: string;

  @Prop({ type: [String], default: [] })
  declare assigneeIds: string[];

  @Prop()
  declare dueDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Task' })
  declare parentTaskId: string;

  @Prop({ default: 0 })
  declare order: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  declare createdBy: string;

  @Prop()
  declare lastDueDateReminderSent: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
