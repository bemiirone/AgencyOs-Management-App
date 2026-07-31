import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../../auth/enums/user-role.enum';

export type TenantMemberDocument = HydratedDocument<TenantMember>;

@Schema({ timestamps: true })
export class TenantMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  declare userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  declare tenantId: Types.ObjectId;

  @Prop({ required: true, enum: UserRole, default: UserRole.MEMBER, type: String })
  declare role: UserRole;

  @Prop({ default: true })
  declare isActive: boolean;

  declare _id: Types.ObjectId;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export const TenantMemberSchema = SchemaFactory.createForClass(TenantMember);
