import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationSettingsController } from './notification-settings.controller';
import { NotificationSettings, NotificationSettingsSchema } from './schemas/notification-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationSettings.name, schema: NotificationSettingsSchema },
    ]),
  ],
  controllers: [NotificationSettingsController],
  providers: [NotificationSettingsService],
  exports: [NotificationSettingsService],
})
export class NotificationSettingsModule {}
