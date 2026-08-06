import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class FaqItem {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  answer: string;

  @Prop({ default: 0 })
  order: number;
}

export const FaqItemSchema = SchemaFactory.createForClass(FaqItem);

@Schema({ timestamps: true })
export class Faq extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ type: [FaqItemSchema], default: [] })
  items: FaqItem[];

  @Prop({ default: 0 })
  order: number;
}

export const FaqSchema = SchemaFactory.createForClass(Faq);
