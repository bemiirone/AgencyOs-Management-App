import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AdminUser extends Document {
  @Prop({ required: true, unique: true })
  declare email: string;

  @Prop({ required: true })
  declare password: string;

  @Prop({ default: true })
  declare isActive: boolean;

  @Prop({ default: 'admin' })
  declare role: string;

  declare _id: Types.ObjectId;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);
