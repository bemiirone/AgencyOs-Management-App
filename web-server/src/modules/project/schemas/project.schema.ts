import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseDocument } from '../../../common/schemas/base.schema';

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true })
export class Project extends BaseDocument {
  @Prop({ required: true })
  declare name: string;

  @Prop()
  declare description: string;

  @Prop({ required: true, enum: ProjectStatus, default: ProjectStatus.DRAFT })
  declare status: ProjectStatus;

  @Prop({ type: [String], default: [] })
  declare teamMemberIds: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  declare ownerId: string;

  @Prop()
  declare clientId: string;

  @Prop()
  declare startDate: Date;

  @Prop()
  declare endDate: Date;

  @Prop()
  declare budget: number;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
