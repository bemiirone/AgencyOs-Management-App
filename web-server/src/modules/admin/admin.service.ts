import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from '../tenant/schemas/tenant.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
  ) {}

  async findAllTenants() {
    return this.tenantModel.find().sort({ createdAt: -1 }).exec();
  }

  async toggleTenantStatus(id: string, isActive: boolean) {
    return this.tenantModel.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true },
    ).exec();
  }

  async deleteTenant(id: string) {
    return this.tenantModel.findByIdAndDelete(id).exec();
  }
}
