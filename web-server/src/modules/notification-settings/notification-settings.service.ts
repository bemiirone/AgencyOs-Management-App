import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationSettings } from './schemas/notification-settings.schema';

@Injectable()
export class NotificationSettingsService implements OnModuleInit {
  constructor(
    @InjectModel(NotificationSettings.name)
    private settingsModel: Model<NotificationSettings>,
  ) { }

  async onModuleInit() {
    const existing = await this.settingsModel.findOne();
    if (!existing) {
      await this.settingsModel.create({});
    }
  }

  private applyDefaults(settings: any): NotificationSettings {
    if (!settings.projectDueSoon || !settings.projectDueSoon.titleTemplate) {
      settings.projectDueSoon = {
        enabled: settings.projectDueSoon?.enabled ?? true,
        titleTemplate: "Project '{{name}}' due in less than a week",
        messageTemplate: "The project '{{name}}' has a deadline approaching. Please review progress.",
      };
    }
    if (!settings.projectOverdue || !settings.projectOverdue.titleTemplate) {
      settings.projectOverdue = {
        enabled: settings.projectOverdue?.enabled ?? true,
        titleTemplate: "Project '{{name}}' is overdue",
        messageTemplate: "The project '{{name}}' has exceeded its deadline. Immediate attention required.",
      };
    }
    if (!settings.taskDueSoon || !settings.taskDueSoon.titleTemplate) {
      settings.taskDueSoon = {
        enabled: settings.taskDueSoon?.enabled ?? true,
        titleTemplate: "Task '{{title}}' due in less than a week",
        messageTemplate: "The task '{{title}}' has a deadline approaching.",
      };
    }
    if (!settings.taskOverdue || !settings.taskOverdue.titleTemplate) {
      settings.taskOverdue = {
        enabled: settings.taskOverdue?.enabled ?? true,
        titleTemplate: "Task '{{title}}' is overdue",
        messageTemplate: "The task '{{title}}' has exceeded its deadline.",
      };
    }
    if (!settings.invoiceDueSoon || !settings.invoiceDueSoon.titleTemplate) {
      settings.invoiceDueSoon = {
        enabled: settings.invoiceDueSoon?.enabled ?? true,
        titleTemplate: "Invoice #{{number}} due in less than a week",
        messageTemplate: "Invoice #{{number}} for {{clientName}} is due soon. Please ensure timely payment.",
      };
    }
    if (!settings.invoiceOverdue || !settings.invoiceOverdue.titleTemplate) {
      settings.invoiceOverdue = {
        enabled: settings.invoiceOverdue?.enabled ?? true,
        titleTemplate: "Invoice #{{number}} is overdue",
        messageTemplate: "Invoice #{{number}} for {{clientName}} has exceeded its due date. Follow up required.",
      };
    }
    return settings;
  }

  async getSettings(): Promise<NotificationSettings> {
    let settings = await this.settingsModel.findOne();
    if (!settings) {
      settings = await this.settingsModel.create({});
    }
    if (!settings) {
      throw new Error('Failed to load notification settings');
    }
    return this.applyDefaults(settings.toObject());
  }

  async updateSettings(update: Partial<NotificationSettings>): Promise<NotificationSettings> {
    let settings = await this.settingsModel.findOne();
    if (!settings) {
      settings = await this.settingsModel.create(update);
    } else {
      settings = await this.settingsModel.findOneAndUpdate({}, { $set: update }, { new: true });
    }
    if (!settings) {
      throw new Error('Failed to update notification settings');
    }
    return this.applyDefaults(settings.toObject());
  }

  async updateLastRun(status: string, count: number): Promise<void> {
    await this.settingsModel.findOneAndUpdate(
      {},
      { $set: { lastRunAt: new Date(), lastRunStatus: status, lastRunCount: count } },
      { upsert: true },
    );
  }
}
