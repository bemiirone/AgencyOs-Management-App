import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseDocument } from '../../../common/schemas/base.schema';

@Schema({ timestamps: true })
export class User extends BaseDocument {
  @Prop({ required: true, unique: true })
  declare email: string;

  @Prop({ required: true })
  declare password: string;

  @Prop({ required: true })
  declare name: string;

  @Prop({ default: true })
  declare isActive: boolean;

  declare _id: Types.ObjectId;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
