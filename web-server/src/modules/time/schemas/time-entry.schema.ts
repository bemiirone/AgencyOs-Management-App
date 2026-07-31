import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseDocument } from '../../../common/schemas/base.schema';

@Schema({ timestamps: true })
export class TimeEntry extends BaseDocument {
  @Prop({ required: true })
  declare userId: string;

  @Prop({ type: Types.ObjectId, ref: 'Task' })
  declare taskId: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  declare projectId: string;

  @Prop({ required: true, default: false })
  declare isRunning: boolean;

  @Prop()
  declare startTime: Date;

  @Prop()
  declare endTime: Date;

  @Prop({ default: 0 })
  declare duration: number;

  @Prop()
  declare description: string;

  @Prop({ default: false })
  declare isBillable: boolean;

  @Prop({ default: false })
  declare isApproved: boolean;

  @Prop()
  declare approvedBy: string;
}

export const TimeEntrySchema = SchemaFactory.createForClass(TimeEntry);
