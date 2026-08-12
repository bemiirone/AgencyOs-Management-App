import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationStatus, NotificationType } from './schemas/notification.schema';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private isMockMode: boolean;

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('sendgrid.apiKey');
    this.isMockMode = !apiKey || apiKey.includes('placeholder');
  }

  async createNotification(
    userId: string,
    tenantId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.WEBSOCKET,
    entityType?: 'project' | 'task',
    entityId?: string,
  ) {
    const notification = await this.notificationModel.create({
      userId,
      tenantId,
      title,
      message,
      type,
      entityType,
      entityId,
    });

    if (type === NotificationType.EMAIL || type === NotificationType.BOTH) {
      await this.sendEmail(userId, title, message);
    }

    return notification;
  }

  async findAll(tenantId: string, userId?: string) {
    const query: Record<string, unknown> = { tenantId };

    if (userId) {
      query.userId = userId;
    }

    return this.notificationModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async markAsRead(id: string, tenantId: string) {
    return this.notificationModel.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { status: NotificationStatus.SENT, sentAt: new Date() } },
      { new: true },
    ).exec();
  }

  private async sendEmail(userId: string, subject: string, message: string) {
    if (this.isMockMode) {
      this.logger.log(`[MOCK EMAIL] To: ${userId}, Subject: ${subject}, Message: ${message}`);
      return { success: true, mock: true };
    }

    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(this.configService.get<string>('sendgrid.apiKey'));

      const msg = {
        to: userId,
        from: {
          email: this.configService.get<string>('sendgrid.fromEmail'),
          name: this.configService.get<string>('sendgrid.fromName'),
        },
        subject,
        text: message,
      };

      await sgMail.send(msg);

      this.logger.log(`Email sent to ${userId}`);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${userId}: ${errorMessage}`);
      throw error;
    }
  }
}
