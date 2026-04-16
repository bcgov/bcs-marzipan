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
import { activityCompletionSettingsSchema } from '@corpcal/shared/schemas';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ApplicationSettingsService } from '../locks/application-settings.service';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { ActivityCompletionJobService } from './activity-completion-job.service';

@ApiTags('settings')
@Controller('settings/activity-completion')
@UseGuards(JwtAuthGuard)
export class ActivityCompletionSettingsController {
  constructor(
    private readonly applicationSettings: ApplicationSettingsService,
    private readonly completionJob: ActivityCompletionJobService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get activity completion automation settings' })
  @ApiResponse({ status: 200, description: 'Current settings' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_ACTIVITY_COMPLETE)
  async getSettings() {
    const settings = await this.applicationSettings.getCompletionSettings();
    return { success: true, data: settings };
  }

  @Patch()
  @ApiOperation({ summary: 'Update activity completion automation settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_ACTIVITY_COMPLETE)
  async patchSettings(
    @Body(new ZodValidationPipe(activityCompletionSettingsSchema))
    body: {
      schedule: string;
      bufferMinutes: number;
    }
  ) {
    await this.applicationSettings.setCompletionSettings(
      body.schedule as 'hourly' | 'twice_daily' | 'daily',
      body.bufferMinutes as 0 | 15 | 30 | 45
    );
    return {
      success: true,
      data: { schedule: body.schedule, bufferMinutes: body.bufferMinutes },
    };
  }

  @Get('run-preview')
  @ApiOperation({
    summary:
      'Preview activities that would be completed by a manual run (saved settings)',
  })
  @ApiResponse({ status: 200, description: 'Eligibility preview' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_ACTIVITY_COMPLETE)
  async previewRun() {
    const data = await this.completionJob.previewEligibleActivities();
    return { success: true, data };
  }

  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger activity completion job manually (admin)',
  })
  @ApiResponse({ status: 200, description: 'Job executed' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_ACTIVITY_COMPLETE)
  async runNow() {
    const result = await this.completionJob.runBatch();
    if (result.skipReason === 'error') {
      throw new InternalServerErrorException('Completion job failed');
    }
    return { success: true, data: result };
  }
}
