import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Content extends Document {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  value: string;

  @Prop({ required: true, index: true })
  category: string;

  @Prop({ default: 'en', index: true })
  locale: string;

  @Prop()
  description: string;
}

export const ContentSchema = SchemaFactory.createForClass(Content);

ContentSchema.index({ key: 1, locale: 1 }, { unique: true });
