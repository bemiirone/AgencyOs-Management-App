import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
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
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true, enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Prop({ required: true, enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: string;

  @Prop({ type: [String], default: [] })
  assigneeIds: string[];

  @Prop()
  dueDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Task' })
  parentTaskId: string;

  @Prop({ default: 0 })
  order: number;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
