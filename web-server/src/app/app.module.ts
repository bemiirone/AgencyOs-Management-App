import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../modules/auth/auth.module';
import { TenantModule } from '../modules/tenant/tenant.module';
import { ProjectModule } from '../modules/project/project.module';
import { TimeModule } from '../modules/time/time.module';
import { BillingModule } from '../modules/billing/billing.module';
import { NotificationModule } from '../modules/notification/notification.module';
import { UserModule } from '../modules/user/user.module';
import { FaqModule } from '../modules/faq/faq.module';
import { PageModule } from '../modules/page/page.module';
import { AdminAuthModule } from '../modules/admin-auth/admin-auth.module';
import { AdminModule } from '../modules/admin/admin.module';
import { SchedulerModule } from '../modules/scheduler/scheduler.module';
import { NotificationSettingsModule } from '../modules/notification-settings/notification-settings.module';
import databaseConfig from '../config/database.config';
import jwtConfig from '../config/jwt.config';
import adminJwtConfig from '../config/admin-jwt.config';
import redisConfig from '../config/redis.config';
import stripeConfig from '../config/stripe.config';
import sendgridConfig from '../config/sendgrid.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, adminJwtConfig, redisConfig, stripeConfig, sendgridConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    TenantModule,
    ProjectModule,
    TimeModule,
    BillingModule,
    NotificationModule,
    UserModule,
    FaqModule,
    PageModule,
    AdminAuthModule,
    AdminModule,
    SchedulerModule,
    NotificationSettingsModule,
  ],
})
export class AppModule {}
