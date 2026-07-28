import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../enums/user-role.enum';
import { BaseDocument } from '../../../common/schemas/base.schema';

@Schema({ timestamps: true })
export class User extends BaseDocument {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.MEMBER, type: String })
  role: UserRole;

  @Prop({ required: true })
  tenantId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
