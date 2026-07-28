import { Module } from '@nestjs/common';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { User, UserSchema } from '../modules/auth/schemas/user.schema';
import { Tenant, TenantSchema } from '../modules/tenant/schemas/tenant.schema';
import { Project, ProjectSchema } from '../modules/project/schemas/project.schema';
import { Task, TaskSchema } from '../modules/project/schemas/task.schema';
import { TimeEntry, TimeEntrySchema } from '../modules/time/schemas/time-entry.schema';
import { Invoice, InvoiceSchema } from '../modules/billing/schemas/invoice.schema';
import databaseConfig from '../config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
      { name: TimeEntry.name, schema: TimeEntrySchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
  ],
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: (connection: Connection) => connection,
      inject: [getConnectionToken()],
    },
  ],
  exports: ['DATABASE_CONNECTION'],
})
export class SeedModule {}
