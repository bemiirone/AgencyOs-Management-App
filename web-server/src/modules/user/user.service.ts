import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/schemas/user.schema';
import { TenantMember } from '../tenant/schemas/tenant-member.schema';
import { UserRole } from '../auth/enums/user-role.enum';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(TenantMember.name) private tenantMemberModel: Model<TenantMember>,
  ) {}

  async findAll(tenantId: string) {
    const memberships = await this.tenantMemberModel.find({ tenantId: new Types.ObjectId(tenantId) }).populate('userId').exec();

    return memberships.map((membership) => {
      const user = membership.userId as unknown as User;
      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: membership.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });
  }

  async findOne(userId: string, tenantId: string) {
    const membership = await this.tenantMemberModel.findOne({
      userId: new Types.ObjectId(userId),
      tenantId: new Types.ObjectId(tenantId),
    }).populate('userId').exec();

    if (!membership) {
      throw new NotFoundException('User not found in this workspace');
    }

    const user = membership.userId as unknown as User;
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: membership.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async create(createUserDto: CreateUserDto, tenantId: string, role: UserRole = UserRole.MEMBER) {
    let user = await this.userModel.findOne({ email: createUserDto.email });

    if (user) {
      const existingMembership = await this.tenantMemberModel.findOne({
        userId: user._id,
        tenantId: new Types.ObjectId(tenantId),
      });

      if (existingMembership) {
        throw new ConflictException('User already exists in this workspace');
      }

      await this.tenantMemberModel.create({
        userId: user._id,
        tenantId: new Types.ObjectId(tenantId),
        role,
        isActive: true,
      });

      const tenantMember = await this.tenantMemberModel.findOne({
        userId: user._id,
        tenantId: new Types.ObjectId(tenantId),
      }).populate('userId');

      const populatedUser = tenantMember?.userId as unknown as User;
      return {
        id: populatedUser._id.toString(),
        email: populatedUser.email,
        name: populatedUser.name,
        role: tenantMember?.role,
        isActive: populatedUser.isActive,
        createdAt: populatedUser.createdAt,
        updatedAt: populatedUser.updatedAt,
      };
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    user = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
      isActive: true,
    });

    await this.tenantMemberModel.create({
      userId: user._id,
      tenantId: new Types.ObjectId(tenantId),
      role,
      isActive: true,
    });

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async update(userId: string, tenantId: string, updateUserDto: UpdateUserDto) {
    const membership = await this.tenantMemberModel.findOne({
      userId: new Types.ObjectId(userId),
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!membership) {
      throw new NotFoundException('User not found in this workspace');
    }

    if (updateUserDto.role) {
      membership.role = updateUserDto.role;
      await membership.save();
    }

    const updateData: Record<string, unknown> = {};
    if (updateUserDto.name) updateData.name = updateUserDto.name;
    if (updateUserDto.email) {
      const existing = await this.userModel.findOne({ email: updateUserDto.email, _id: { $ne: userId } });
      if (existing) {
        throw new ConflictException('Email already in use');
      }
      updateData.email = updateUserDto.email;
    }

    if (Object.keys(updateData).length > 0) {
      await this.userModel.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
    }

    return this.findOne(userId, tenantId);
  }

  async softDelete(userId: string, tenantId: string) {
    const membership = await this.tenantMemberModel.findOne({
      userId: new Types.ObjectId(userId),
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!membership) {
      throw new NotFoundException('User not found in this workspace');
    }

    membership.isActive = false;
    await membership.save();

    const userMemberships = await this.tenantMemberModel.find({ userId: new Types.ObjectId(userId) });
    const allInactive = userMemberships.every((m) => !m.isActive);

    if (allInactive) {
      await this.userModel.findByIdAndUpdate(userId, { $set: { isActive: false } });
    }

    return { success: true };
  }

  async reactivate(userId: string, tenantId: string) {
    const membership = await this.tenantMemberModel.findOne({
      userId: new Types.ObjectId(userId),
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!membership) {
      throw new NotFoundException('User not found in this workspace');
    }

    membership.isActive = true;
    await membership.save();

    await this.userModel.findByIdAndUpdate(userId, { $set: { isActive: true } });

    return this.findOne(userId, tenantId);
  }
}
