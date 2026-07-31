import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class BaseDocument extends Document {
  @Prop({ index: true, type: String })
  declare tenantId: string;

  declare _id: Types.ObjectId;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export const BaseSchema = SchemaFactory.createForClass(BaseDocument);

BaseSchema.index({ tenantId: 1 });
