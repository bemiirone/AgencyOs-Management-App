import { Controller, Get, Put, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationSettingsService } from './notification-settings.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class NotificationTypeConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  titleTemplate?: string;

  @IsOptional()
  @IsString()
  messageTemplate?: string;
}

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationTypeConfigDto)
  projectDueSoon?: NotificationTypeConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationTypeConfigDto)
  projectOverdue?: NotificationTypeConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationTypeConfigDto)
  taskDueSoon?: NotificationTypeConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationTypeConfigDto)
  taskOverdue?: NotificationTypeConfigDto;
}

@ApiTags('admin')
@Controller('admin/notification-settings')
@UseGuards(AdminJwtAuthGuard)
export class NotificationSettingsController {
  constructor(private readonly settingsService: NotificationSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notification settings (admin only)' })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @ApiOperation({ summary: 'Update notification settings (admin only)' })
  async updateSettings(@Body() data: UpdateNotificationSettingsDto) {
    return this.settingsService.updateSettings(data);
  }
}
