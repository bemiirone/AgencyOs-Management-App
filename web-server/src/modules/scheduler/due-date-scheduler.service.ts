import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DueDateCheckerService } from './due-date-checker.service';

@Injectable()
export class DueDateSchedulerService {
  private readonly logger = new Logger(DueDateSchedulerService.name);

  constructor(private readonly checkerService: DueDateCheckerService) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM, { name: 'dueDateReminders' })
  async handleDueDateReminders() {
    this.logger.log('Running scheduled due date reminder check');
    try {
      await this.checkerService.checkAllDueDates();
    } catch (error) {
      this.logger.error(`Due date reminder check failed: ${error.message}`);
    }
  }
}
