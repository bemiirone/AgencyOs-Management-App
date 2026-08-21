import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Tenant, TenantSchema } from '../tenant/schemas/tenant.schema';
import { PageModule } from '../page/page.module';
import { FaqModule } from '../faq/faq.module';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
    ]),
    PageModule,
    FaqModule,
    ContentModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
