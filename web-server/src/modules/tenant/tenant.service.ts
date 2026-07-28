import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from './schemas/tenant.schema';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
  ) {}

  async create(createTenantDto: CreateTenantDto, ownerId: string) {
    const existingTenant = await this.tenantModel.findOne({ slug: createTenantDto.slug });

    if (existingTenant) {
      throw new ConflictException('Tenant slug already exists');
    }

    const tenant = await this.tenantModel.create({
      ...createTenantDto,
      ownerId,
    });

    return tenant;
  }

  async findAll(userId: string) {
    return this.tenantModel.find({
      $or: [{ ownerId: userId }, { memberIds: userId }],
    }).exec();
  }

  async findOne(id: string, tenantId: string) {
    const tenant = await this.tenantModel.findOne({ _id: id, tenantId }).exec();

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(id: string, tenantId: string, updateData: Partial<CreateTenantDto>) {
    const tenant = await this.tenantModel.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updateData },
      { new: true },
    ).exec();

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async remove(id: string, tenantId: string) {
    const result = await this.tenantModel.deleteOne({ _id: id, tenantId }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Tenant not found');
    }

    return { success: true };
  }
}
