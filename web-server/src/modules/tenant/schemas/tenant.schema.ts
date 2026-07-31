import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Tenant extends Document {
  @Prop({ required: true, unique: true })
  declare name: string;

  @Prop({ required: true })
  declare slug: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  declare ownerId: Types.ObjectId;

  @Prop({ type: [{ type: String }], default: [] })
  declare memberIds: string[];

  @Prop({ default: true })
  declare isActive: boolean;

  declare _id: Types.ObjectId;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
