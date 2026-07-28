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
import databaseConfig from '../config/database.config';
import jwtConfig from '../config/jwt.config';
import redisConfig from '../config/redis.config';
import stripeConfig from '../config/stripe.config';
import sendgridConfig from '../config/sendgrid.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig, stripeConfig, sendgridConfig],
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
  ],
})
export class AppModule {}
