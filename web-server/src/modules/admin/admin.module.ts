import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Tenant, TenantSchema } from '../tenant/schemas/tenant.schema';
import { PageModule } from '../page/page.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
    ]),
    PageModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
