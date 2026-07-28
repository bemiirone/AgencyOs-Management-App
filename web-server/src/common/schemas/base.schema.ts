import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class BaseDocument extends Document {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const BaseSchema = SchemaFactory.createForClass(BaseDocument);

BaseSchema.index({ tenantId: 1 });
