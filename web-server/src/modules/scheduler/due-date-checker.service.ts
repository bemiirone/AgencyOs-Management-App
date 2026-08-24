import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectStatus } from '../project/schemas/project.schema';
import { Task, TaskStatus } from '../project/schemas/task.schema';
import { Invoice, InvoiceStatus } from '../billing/schemas/invoice.schema';
import { TenantMember, UserRole } from '../tenant/schemas/tenant-member.schema';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/schemas/notification.schema';
import { TenantService } from '../tenant/tenant.service';
import { NotificationSettingsService } from '../notification-settings/notification-settings.service';

@Injectable()
export class DueDateCheckerService {
  private readonly logger = new Logger(DueDateCheckerService.name);

  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(TenantMember.name) private tenantMemberModel: Model<TenantMember>,
    private notificationService: NotificationService,
    private tenantService: TenantService,
    private settingsService: NotificationSettingsService,
  ) {}

  async checkAllDueDates() {
    this.logger.log('Starting due date reminder check');

    const settings = await this.settingsService.getSettings();

    if (!settings.enabled) {
      this.logger.log('Notifications are globally disabled, skipping check');
      await this.settingsService.updateLastRun('skipped_disabled', 0);
      return 0;
    }

    const tenants = await this.tenantService.findAllActive();
    let notificationsCreated = 0;

    for (const tenant of tenants) {
      const tenantId = tenant._id.toString();
      const count = await this.checkTenant(tenantId, settings);
      notificationsCreated += count;
    }

    this.logger.log(`Due date reminder check complete. Created ${notificationsCreated} notifications`);
    await this.settingsService.updateLastRun('completed', notificationsCreated);
    return notificationsCreated;
  }

  private async checkTenant(tenantId: string, settings: any): Promise<number> {
    let count = 0;
    count += await this.checkProjects(tenantId, settings);
    count += await this.checkTasks(tenantId, settings);
    count += await this.checkInvoices(tenantId, settings);
    return count;
  }

  private async checkProjects(tenantId: string, settings: any): Promise<number> {
    let count = 0;
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const projects = await this.projectModel.find({ tenantId }).exec();

    for (const project of projects) {
      if (!project.endDate) continue;

      const endDate = new Date(project.endDate);
      const lastReminder = project.lastDueDateReminderSent;

      const isDueSoon =
        endDate <= sevenDaysFromNow &&
        endDate > now &&
        project.status === ProjectStatus.ACTIVE &&
        (!lastReminder || lastReminder < now);

      const isOverdue =
        endDate < now &&
        project.status === ProjectStatus.ACTIVE &&
        (!lastReminder || lastReminder < now);

      if (isDueSoon && settings.projectDueSoon?.enabled) {
        await this.notifyProjectRecipients(project, tenantId, 'due_soon', settings.projectDueSoon);
        count++;
      } else if (isOverdue && settings.projectOverdue?.enabled) {
        await this.notifyProjectRecipients(project, tenantId, 'overdue', settings.projectOverdue);
        count++;
      }
    }

    return count;
  }

  private async checkTasks(tenantId: string, settings: any): Promise<number> {
    let count = 0;
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const tasks = await this.taskModel.find({ tenantId }).exec();

    for (const task of tasks) {
      if (!task.dueDate) continue;

      const dueDate = new Date(task.dueDate);
      const lastReminder = task.lastDueDateReminderSent;

      const isDueSoon =
        dueDate <= sevenDaysFromNow &&
        dueDate > now &&
        task.status !== TaskStatus.DONE &&
        (!lastReminder || lastReminder < now);

      const isOverdue =
        dueDate < now &&
        task.status !== TaskStatus.DONE &&
        (!lastReminder || lastReminder < now);

      if (isDueSoon && settings.taskDueSoon?.enabled) {
        await this.notifyTaskRecipients(task, tenantId, 'due_soon', settings.taskDueSoon);
        count++;
      } else if (isOverdue && settings.taskOverdue?.enabled) {
        await this.notifyTaskRecipients(task, tenantId, 'overdue', settings.taskOverdue);
        count++;
      }
    }

    return count;
  }

  private async checkInvoices(tenantId: string, settings: any): Promise<number> {
    let count = 0;
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const invoices = await this.invoiceModel.find({ tenantId, status: InvoiceStatus.SENT }).exec();

    for (const invoice of invoices) {
      if (!invoice.dueDate) continue;

      const dueDate = new Date(invoice.dueDate);
      const lastReminder = invoice.lastDueDateReminderSent;

      const isDueSoon =
        dueDate <= sevenDaysFromNow &&
        dueDate > now &&
        (!lastReminder || lastReminder < now);

      const isOverdue =
        dueDate < now &&
        (!lastReminder || lastReminder < now);

      if (isDueSoon && settings.invoiceDueSoon?.enabled) {
        await this.notifyInvoiceRecipients(invoice, tenantId, settings.invoiceDueSoon);
        count++;
      } else if (isOverdue && settings.invoiceOverdue?.enabled) {
        await this.notifyInvoiceRecipients(invoice, tenantId, settings.invoiceOverdue);
        count++;
      }
    }

    return count;
  }

  private resolveTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
  }

  private async notifyProjectRecipients(
    project: Project,
    tenantId: string,
    _type: 'due_soon' | 'overdue',
    config: { titleTemplate: string; messageTemplate: string },
  ) {
    const recipients = new Set<string>();
    if (project.ownerId) recipients.add(project.ownerId.toString());
    for (const memberId of project.teamMemberIds || []) {
      recipients.add(memberId);
    }

    const variables = { name: project.name };
    const title = this.resolveTemplate(config.titleTemplate, variables);
    const message = this.resolveTemplate(config.messageTemplate, variables);

    for (const userId of recipients) {
      await this.notificationService.createNotification(
        userId,
        tenantId,
        title,
        message,
        NotificationType.WEBSOCKET,
        'project',
        project._id.toString(),
      );
    }

    await this.projectModel.findByIdAndUpdate(project._id, {
      $set: { lastDueDateReminderSent: new Date() },
    });
  }

  private async notifyTaskRecipients(
    task: Task,
    tenantId: string,
    _type: 'due_soon' | 'overdue',
    config: { titleTemplate: string; messageTemplate: string },
  ) {
    const recipients = new Set<string>();
    if (task.createdBy) recipients.add(task.createdBy.toString());
    for (const assigneeId of task.assigneeIds || []) {
      recipients.add(assigneeId);
    }

    const variables = { title: task.title };
    const title = this.resolveTemplate(config.titleTemplate, variables);
    const message = this.resolveTemplate(config.messageTemplate, variables);

    for (const userId of recipients) {
      await this.notificationService.createNotification(
        userId,
        tenantId,
        title,
        message,
        NotificationType.WEBSOCKET,
        'task',
        task._id.toString(),
      );
    }

    await this.taskModel.findByIdAndUpdate(task._id, {
      $set: { lastDueDateReminderSent: new Date() },
    });
  }

  private async notifyInvoiceRecipients(
    invoice: Invoice,
    tenantId: string,
    config: { titleTemplate: string; messageTemplate: string },
  ) {
    const adminMembers = await this.tenantMemberModel.find({
      tenantId,
      role: { $in: [UserRole.ADMIN, UserRole.MANAGER] },
      isActive: true,
    }).exec();

    const variables = { number: invoice.invoiceNumber, clientName: invoice.clientName };
    const title = this.resolveTemplate(config.titleTemplate, variables);
    const message = this.resolveTemplate(config.messageTemplate, variables);

    for (const member of adminMembers) {
      await this.notificationService.createNotification(
        member.userId.toString(),
        tenantId,
        title,
        message,
        NotificationType.WEBSOCKET,
        'invoice',
        invoice._id.toString(),
      );
    }

    await this.invoiceModel.findByIdAndUpdate(invoice._id, {
      $set: { lastDueDateReminderSent: new Date() },
    });
  }
}
