import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PERMISSIONS } from '@corpcal/shared';
import { activityReminderSettingsSchema } from '@corpcal/shared/schemas';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ApplicationSettingsService } from '../locks/application-settings.service';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { ActivityReminderJobService } from './activity-reminder-job.service';

@ApiTags('settings')
@Controller('settings/activity-reminders')
@UseGuards(JwtAuthGuard)
export class ActivityReminderSettingsController {
  constructor(
    private readonly applicationSettings: ApplicationSettingsService,
    private readonly reminderJob: ActivityReminderJobService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get activity reminder settings' })
  @ApiResponse({ status: 200, description: 'Current settings' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE)
  async getSettings() {
    const settings =
      await this.applicationSettings.getActivityReminderSettings();
    return { success: true, data: settings };
  }

  @Patch()
  @ApiOperation({ summary: 'Update activity reminder settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE)
  async patchSettings(
    @Body(new ZodValidationPipe(activityReminderSettingsSchema))
    body: {
      leadDays: number;
      staleDays: number;
    }
  ) {
    await this.applicationSettings.setActivityReminderSettings(body);
    return { success: true, data: body };
  }

  @Get('run-preview')
  @ApiOperation({
    summary: 'Preview activities eligible for reminder notifications',
  })
  @ApiResponse({ status: 200, description: 'Eligibility preview' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE)
  async previewRun() {
    const counts = await this.reminderJob.previewBatch();
    return { success: true, data: counts };
  }

  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger activity reminder job manually (admin)' })
  @ApiResponse({ status: 200, description: 'Job executed' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE)
  async runNow() {
    const result = await this.reminderJob.runBatch();
    if (result.skipReason === 'error') {
      throw new InternalServerErrorException('Activity reminder job failed');
    }
    return { success: true, data: result };
  }
}
