import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseDocument } from '../../../common/schemas/base.schema';

@Schema({ timestamps: true })
export class Tenant extends BaseDocument {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  ownerId: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
