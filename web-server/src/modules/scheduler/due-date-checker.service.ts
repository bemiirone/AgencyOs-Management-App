import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectStatus } from '../project/schemas/project.schema';
import { Task, TaskStatus } from '../project/schemas/task.schema';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/schemas/notification.schema';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class DueDateCheckerService {
  private readonly logger = new Logger(DueDateCheckerService.name);

  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    private notificationService: NotificationService,
    private tenantService: TenantService,
  ) {}

  async checkAllDueDates() {
    this.logger.log('Starting due date reminder check');

    const tenants = await this.tenantService.findAllActive();
    let notificationsCreated = 0;

    for (const tenant of tenants) {
      const tenantId = tenant._id.toString();
      const count = await this.checkTenant(tenantId);
      notificationsCreated += count;
    }

    this.logger.log(`Due date reminder check complete. Created ${notificationsCreated} notifications`);
  }

  private async checkTenant(tenantId: string): Promise<number> {
    let count = 0;
    count += await this.checkProjects(tenantId);
    count += await this.checkTasks(tenantId);
    return count;
  }

  private async checkProjects(tenantId: string): Promise<number> {
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

      if (isDueSoon) {
        await this.notifyProjectRecipients(project, tenantId, 'due_soon');
        count++;
      } else if (isOverdue) {
        await this.notifyProjectRecipients(project, tenantId, 'overdue');
        count++;
      }
    }

    return count;
  }

  private async checkTasks(tenantId: string): Promise<number> {
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

      if (isDueSoon) {
        await this.notifyTaskRecipients(task, tenantId, 'due_soon');
        count++;
      } else if (isOverdue) {
        await this.notifyTaskRecipients(task, tenantId, 'overdue');
        count++;
      }
    }

    return count;
  }

  private async notifyProjectRecipients(
    project: Project,
    tenantId: string,
    type: 'due_soon' | 'overdue',
  ) {
    const recipients = new Set<string>();
    if (project.ownerId) recipients.add(project.ownerId.toString());
    for (const memberId of project.teamMemberIds || []) {
      recipients.add(memberId);
    }

    const title = type === 'due_soon'
      ? `Project "${project.name}" due in less than a week`
      : `Project "${project.name}" is overdue`;

    const message = type === 'due_soon'
      ? `The project "${project.name}" has a deadline approaching. Please review progress.`
      : `The project "${project.name}" has exceeded its deadline. Immediate attention required.`;

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
    type: 'due_soon' | 'overdue',
  ) {
    const recipients = new Set<string>();
    if (task.createdBy) recipients.add(task.createdBy.toString());
    for (const assigneeId of task.assigneeIds || []) {
      recipients.add(assigneeId);
    }

    const title = type === 'due_soon'
      ? `Task "${task.title}" due in less than a week`
      : `Task "${task.title}" is overdue`;

    const message = type === 'due_soon'
      ? `The task "${task.title}" has a deadline approaching.`
      : `The task "${task.title}" has exceeded its deadline.`;

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
}
