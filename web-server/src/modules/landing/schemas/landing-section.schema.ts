import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'landing-sections' })
export class LandingSection extends Document {
  @Prop({ required: true })
  section: string;

  @Prop({ required: true, default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  icon?: string;

  @Prop()
  title?: string;

  @Prop()
  description?: string;

  @Prop()
  name?: string;

  @Prop()
  role?: string;

  @Prop({ min: 1, max: 5 })
  rating?: number;

  @Prop()
  question?: string;

  @Prop()
  answer?: string;
}

export const LandingSectionSchema = SchemaFactory.createForClass(LandingSection);
LandingSectionSchema.index({ section: 1, order: 1 });
