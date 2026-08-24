import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { DueDateSchedulerService } from './due-date-scheduler.service';
import { DueDateCheckerService } from './due-date-checker.service';
import { SchedulerController } from './scheduler.controller';
import { Project, ProjectSchema } from '../project/schemas/project.schema';
import { Task, TaskSchema } from '../project/schemas/task.schema';
import { Invoice, InvoiceSchema } from '../billing/schemas/invoice.schema';
import { TenantMember, TenantMemberSchema } from '../tenant/schemas/tenant-member.schema';
import { NotificationModule } from '../notification/notification.module';
import { TenantModule } from '../tenant/tenant.module';
import { NotificationSettingsModule } from '../notification-settings/notification-settings.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: TenantMember.name, schema: TenantMemberSchema },
    ]),
    NotificationModule,
    TenantModule,
    NotificationSettingsModule,
  ],
  controllers: [SchedulerController],
  providers: [DueDateSchedulerService, DueDateCheckerService],
  exports: [DueDateCheckerService],
})
export class SchedulerModule {}
