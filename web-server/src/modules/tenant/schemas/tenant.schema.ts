import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Tenant extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  ownerId: string;

  @Prop({ default: true })
  isActive: boolean;

  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
