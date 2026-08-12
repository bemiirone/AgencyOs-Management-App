import { Controller, Post } from '@nestjs/common';
import { DueDateCheckerService } from './due-date-checker.service';

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly checkerService: DueDateCheckerService) {}

  @Post('trigger-due-date-check')
  async triggerDueDateCheck() {
    const count = await this.checkerService.checkAllDueDates();
    return { success: true, notificationsCreated: count };
  }
}
