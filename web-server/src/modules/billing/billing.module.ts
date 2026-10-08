import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { TimeEntry, TimeEntrySchema } from '../time/schemas/time-entry.schema';
import { Project, ProjectSchema } from '../project/schemas/project.schema';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
    MongooseModule.forFeature([{ name: TimeEntry.name, schema: TimeEntrySchema }]),
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    EmailModule,
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class BillingModule {}
