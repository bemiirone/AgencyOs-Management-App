import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseDocument } from '../../../common/schemas/base.schema';

@Schema({ timestamps: true })
export class TimeEntry extends BaseDocument {
  @Prop({ required: true })
  userId: string;

  @Prop({ type: Types.ObjectId, ref: 'Task' })
  taskId?: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: string;

  @Prop({ required: true, default: false })
  isRunning: boolean;

  @Prop()
  startTime: Date;

  @Prop()
  endTime: Date;

  @Prop({ default: 0 })
  duration: number;

  @Prop()
  description: string;

  @Prop({ default: false })
  isBillable: boolean;

  @Prop({ default: false })
  isApproved: boolean;

  @Prop()
  approvedBy: string;
}

export const TimeEntrySchema = SchemaFactory.createForClass(TimeEntry);
