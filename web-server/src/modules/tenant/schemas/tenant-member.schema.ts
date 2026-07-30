import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../auth/enums/user-role.enum';

@Schema({ timestamps: true })
export class TenantMember extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.MEMBER, type: String })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const TenantMemberSchema = SchemaFactory.createForClass(TenantMember);
