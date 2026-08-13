import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationSettings } from './schemas/notification-settings.schema';

@Injectable()
export class NotificationSettingsService implements OnModuleInit {
  constructor(
    @InjectModel(NotificationSettings.name)
    private settingsModel: Model<NotificationSettings>,
  ) {}

  async onModuleInit() {
    const existing = await this.settingsModel.findOne();
    if (!existing) {
      await this.settingsModel.create({});
    }
  }

  async getSettings(): Promise<NotificationSettings> {
    let settings = await this.settingsModel.findOne();
    if (!settings) {
      settings = await this.settingsModel.create({});
    }
    return settings;
  }

  async updateSettings(update: Partial<NotificationSettings>): Promise<NotificationSettings> {
    let settings = await this.settingsModel.findOne();
    if (!settings) {
      settings = await this.settingsModel.create(update);
    } else {
      settings = await this.settingsModel.findOneAndUpdate({}, { $set: update }, { new: true });
    }
    return settings;
  }

  async updateLastRun(status: string, count: number): Promise<void> {
    await this.settingsModel.findOneAndUpdate(
      {},
      { $set: { lastRunAt: new Date(), lastRunStatus: status, lastRunCount: count } },
      { upsert: true },
    );
  }
}
