import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PERMISSIONS } from '@corpcal/shared';
import {
  activityInfoIconSettingsSchema,
  type ActivityInfoIconSettings,
} from '@corpcal/shared/schemas';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { ApplicationSettingsService } from './application-settings.service';

@ApiTags('settings')
@Controller('settings/activity-info-icons')
@UseGuards(JwtAuthGuard)
export class ActivityInfoIconsController {
  constructor(
    private readonly applicationSettings: ApplicationSettingsService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get activity info icon field settings' })
  @ApiResponse({ status: 200, description: 'Current settings' })
  @HttpCode(HttpStatus.OK)
  async getSettings(): Promise<{
    success: true;
    data: ActivityInfoIconSettings;
  }> {
    const data = await this.applicationSettings.getActivityInfoIconSettings();
    return { success: true, data };
  }

  @Patch()
  @ApiOperation({ summary: 'Update activity info icon field settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_ACTIVITY_INFO_ICONS)
  async patchSettings(
    @Body(new ZodValidationPipe(activityInfoIconSettingsSchema))
    body: ActivityInfoIconSettings
  ): Promise<{ success: true; data: ActivityInfoIconSettings }> {
    await this.applicationSettings.setActivityInfoIconSettings(body);
    return { success: true, data: body };
  }
}
