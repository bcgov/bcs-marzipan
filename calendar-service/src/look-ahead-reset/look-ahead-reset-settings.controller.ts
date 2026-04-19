import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { ZodIssue } from 'zod';

import {
  MAX_LOOK_AHEAD_RESET_WINDOW_DAYS,
  MIN_LOOK_AHEAD_RESET_WINDOW_DAYS,
  PERMISSIONS,
  type AuthUser,
} from '@corpcal/shared';
import {
  lookAheadResetManualRunBodySchema,
  lookAheadResetSettingsSchema,
} from '@corpcal/shared/schemas';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ApplicationSettingsService } from '../locks/application-settings.service';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { LookAheadResetJobService } from './look-ahead-reset-job.service';

@ApiTags('settings')
@Controller('settings/look-ahead-reset')
@UseGuards(JwtAuthGuard)
export class LookAheadResetSettingsController {
  constructor(
    private readonly applicationSettings: ApplicationSettingsService,
    private readonly lookAheadResetJob: LookAheadResetJobService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get Look Ahead reset window settings' })
  @ApiResponse({ status: 200, description: 'Current settings' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_LOOK_AHEAD_RESET)
  async getSettings() {
    const windowDaysAfterToday =
      await this.applicationSettings.getLookAheadResetWindowDays();
    return {
      success: true,
      data: { windowDaysAfterToday },
    };
  }

  @Patch()
  @ApiOperation({
    summary: 'Update Look Ahead reset window (days after today)',
  })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_LOOK_AHEAD_RESET)
  async patchSettings(
    @Body(new ZodValidationPipe(lookAheadResetSettingsSchema))
    body: {
      windowDaysAfterToday: number;
    }
  ) {
    await this.applicationSettings.setLookAheadResetWindowDays(
      body.windowDaysAfterToday
    );
    return {
      success: true,
      data: { windowDaysAfterToday: body.windowDaysAfterToday },
    };
  }

  @Get('run-preview')
  @ApiOperation({
    summary:
      'Preview activities that would be cleared on the next run (optional days query overrides saved window)',
  })
  @ApiResponse({ status: 200, description: 'Eligibility preview' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_LOOK_AHEAD_RESET)
  async previewRun(@Query('days') daysRaw?: string) {
    let days = await this.applicationSettings.getLookAheadResetWindowDays();
    if (daysRaw !== undefined && daysRaw !== '') {
      const parsed = Number.parseInt(daysRaw, 10);
      if (Number.isFinite(parsed)) {
        days = Math.min(
          MAX_LOOK_AHEAD_RESET_WINDOW_DAYS,
          Math.max(MIN_LOOK_AHEAD_RESET_WINDOW_DAYS, parsed)
        );
      }
    }
    const data = await this.lookAheadResetJob.previewEligibleActivities(days);
    return { success: true, data };
  }

  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear Look Ahead status manually (admin)' })
  @ApiResponse({ status: 200, description: 'Job executed' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_LOOK_AHEAD_RESET)
  async runNow(@CurrentUser() user: AuthUser, @Body() rawBody: unknown) {
    const parsed = lookAheadResetManualRunBodySchema.safeParse(
      rawBody === null || rawBody === undefined ? {} : rawBody
    );
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parsed.error.issues.map((issue: ZodIssue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    const body = parsed.data;
    const daysOverride = body.days;
    const result = await this.lookAheadResetJob.runBatch({
      actorUserId: user.id,
      trigger: 'manual',
      daysOverride,
    });
    if (result.skipReason === 'error') {
      throw new InternalServerErrorException('Look Ahead reset job failed');
    }
    return { success: true, data: result };
  }
}
