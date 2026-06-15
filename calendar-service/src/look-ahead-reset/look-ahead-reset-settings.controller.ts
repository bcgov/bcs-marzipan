import {
  BadRequestException,
  Body,
  ConflictException,
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

import { PERMISSIONS, type AuthUser } from '@corpcal/shared';
import {
  lookAheadResetManualRunBodySchema,
  lookAheadResetRunPreviewQuerySchema,
  lookAheadResetSettingsPatchSchema,
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
  @ApiOperation({ summary: 'Get Look Ahead reset settings' })
  @ApiResponse({ status: 200, description: 'Current settings' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_LOOK_AHEAD_RESET)
  async getSettings() {
    const [windowDaysAfterToday, cronMode, rollbackAvailable, lastClear] =
      await Promise.all([
        this.applicationSettings.getLookAheadResetWindowDays(),
        this.applicationSettings.getLookAheadResetCronMode(),
        this.lookAheadResetJob.isRollbackAvailable(),
        this.lookAheadResetJob.getLastClearSummary(),
      ]);

    return {
      success: true,
      data: {
        windowDaysAfterToday,
        cronMode,
        rollbackAvailable,
        ...(lastClear ? { lastClear } : {}),
      },
    };
  }

  @Patch()
  @ApiOperation({
    summary: 'Update Look Ahead reset window and/or scheduled job state',
  })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_LOOK_AHEAD_RESET)
  async patchSettings(
    @Body(new ZodValidationPipe(lookAheadResetSettingsPatchSchema))
    body: {
      windowDaysAfterToday?: number;
      cronMode?: 'running' | 'paused_today' | 'stopped';
    }
  ) {
    if (body.windowDaysAfterToday !== undefined) {
      await this.applicationSettings.setLookAheadResetWindowDays(
        body.windowDaysAfterToday
      );
    }
    if (body.cronMode !== undefined) {
      await this.applicationSettings.setLookAheadResetCronMode(body.cronMode);
    }

    const [windowDaysAfterToday, cronMode, rollbackAvailable, lastClear] =
      await Promise.all([
        this.applicationSettings.getLookAheadResetWindowDays(),
        this.applicationSettings.getLookAheadResetCronMode(),
        this.lookAheadResetJob.isRollbackAvailable(),
        this.lookAheadResetJob.getLastClearSummary(),
      ]);

    return {
      success: true,
      data: {
        windowDaysAfterToday,
        cronMode,
        rollbackAvailable,
        ...(lastClear ? { lastClear } : {}),
      },
    };
  }

  @Get('run-preview')
  @ApiOperation({
    summary:
      'Preview activities that would be cleared on the next manual run (scope, days, includePast)',
  })
  @ApiResponse({ status: 200, description: 'Eligibility preview' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_LOOK_AHEAD_RESET)
  async previewRun(@Query() rawQuery: Record<string, string | undefined>) {
    const parsed = lookAheadResetRunPreviewQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parsed.error.issues.map((issue: ZodIssue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const persistedWindowDays =
      await this.applicationSettings.getLookAheadResetWindowDays();
    const data = await this.lookAheadResetJob.previewEligibleActivities({
      scope: parsed.data.scope,
      days: parsed.data.days,
      includePast: parsed.data.includePast,
      persistedWindowDays,
    });
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

    const result = await this.lookAheadResetJob.runBatch({
      actorUserId: user.id,
      trigger: 'manual',
      manual: {
        scope: parsed.data.scope,
        days: parsed.data.days,
        includePast: parsed.data.includePast,
      },
    });
    if (result.skipReason === 'error') {
      throw new InternalServerErrorException('Look Ahead reset job failed');
    }

    let scheduledRunPausedTonight = false;
    if (parsed.data.pauseScheduledTonight && !result.skipped) {
      const currentMode =
        await this.applicationSettings.getLookAheadResetCronMode();
      if (currentMode === 'running') {
        await this.applicationSettings.setLookAheadResetCronMode(
          'paused_today'
        );
        scheduledRunPausedTonight = true;
      }
    }

    return {
      success: true,
      data: { ...result, scheduledRunPausedTonight },
    };
  }

  @Post('rollback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore Look Ahead statuses from before the last clear',
  })
  @ApiResponse({ status: 200, description: 'Rollback executed' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_LOOK_AHEAD_RESET)
  async rollback(@CurrentUser() user: AuthUser) {
    const available = await this.lookAheadResetJob.isRollbackAvailable();
    if (!available) {
      throw new ConflictException(
        'No Look Ahead clear is available to roll back'
      );
    }

    const result = await this.lookAheadResetJob.rollbackLastClear(user.id);
    if (
      !result.rollbackAvailable &&
      result.restored === 0 &&
      result.skipped === 0
    ) {
      throw new ConflictException(
        'No Look Ahead clear is available to roll back'
      );
    }

    return { success: true, data: result };
  }
}
