import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseDocument } from '../../../common/schemas/base.schema';

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true })
export class Project extends BaseDocument {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true, enum: ProjectStatus, default: ProjectStatus.DRAFT })
  status: ProjectStatus;

  @Prop({ type: [String], default: [] })
  teamMemberIds: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  ownerId: string;

  @Prop()
  clientId: string;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop()
  budget: number;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
