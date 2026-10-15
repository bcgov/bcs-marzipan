import {
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
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PERMISSIONS, type AuthUser } from '@corpcal/shared';
import {
  lookAheadResetManualRunRequestSchema,
  lookAheadResetRunPreviewQuerySchema,
  lookAheadResetSettingsPatchSchema,
  type LookAheadResetManualRunBody,
  type LookAheadResetRunPreviewQuery,
} from '@corpcal/shared/schemas';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  LookAheadResetBatchRunResponseWrapperDto,
  LookAheadResetManualRunBodyDto,
  LookAheadResetRollbackResponseWrapperDto,
  LookAheadResetRunPreviewResponseWrapperDto,
  LookAheadResetSettingsPatchDto,
  LookAheadResetSettingsResponseWrapperDto,
} from '../common/dto/settings.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ApiZodQueries } from '../common/swagger/zod-query.openapi';
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
  @ApiResponse({
    status: 200,
    description: 'Current settings',
    type: LookAheadResetSettingsResponseWrapperDto,
  })
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
  @ApiBody({ type: LookAheadResetSettingsPatchDto })
  @ApiResponse({
    status: 200,
    description: 'Settings updated',
    type: LookAheadResetSettingsResponseWrapperDto,
  })
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
  @ApiZodQueries(lookAheadResetRunPreviewQuerySchema)
  @ApiResponse({
    status: 200,
    description: 'Eligibility preview',
    type: LookAheadResetRunPreviewResponseWrapperDto,
  })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_LOOK_AHEAD_RESET)
  async previewRun(
    @Query(new ZodValidationPipe(lookAheadResetRunPreviewQuerySchema))
    query: LookAheadResetRunPreviewQuery
  ) {
    const persistedWindowDays =
      await this.applicationSettings.getLookAheadResetWindowDays();
    const data = await this.lookAheadResetJob.previewEligibleActivities({
      scope: query.scope,
      days: query.days,
      includePast: query.includePast,
      persistedWindowDays,
    });
    return { success: true, data };
  }

  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear Look Ahead status manually (admin)' })
  @ApiBody({ type: LookAheadResetManualRunBodyDto })
  @ApiResponse({
    status: 200,
    description: 'Job executed',
    type: LookAheadResetBatchRunResponseWrapperDto,
  })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_LOOK_AHEAD_RESET)
  async runNow(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(lookAheadResetManualRunRequestSchema))
    body: LookAheadResetManualRunBody
  ) {
    const result = await this.lookAheadResetJob.runBatch({
      actorUserId: user.id,
      trigger: 'manual',
      pauseScheduledTonight: body.pauseScheduledTonight,
      manual: {
        scope: body.scope,
        days: body.days,
        includePast: body.includePast,
      },
    });
    if (result.skipReason === 'error') {
      throw new InternalServerErrorException('Look Ahead reset job failed');
    }

    return {
      success: true,
      data: result,
    };
  }

  @Post('rollback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore Look Ahead statuses from before the last clear',
  })
  @ApiResponse({
    status: 200,
    description: 'Rollback executed',
    type: LookAheadResetRollbackResponseWrapperDto,
  })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_LOOK_AHEAD_RESET)
  async rollback(@CurrentUser() user: AuthUser) {
    const available = await this.lookAheadResetJob.isRollbackAvailable();
    if (!available) {
      throw new ConflictException(
        'No Look Ahead clear is available to roll back'
      );
    }

    const result = await this.lookAheadResetJob.rollbackLastClear(user.id);
    if (result.skippedRollback) {
      throw new ConflictException(
        result.skipReason === 'in_flight'
          ? 'Look Ahead restore is already running on this server'
          : 'Another instance is running the Look Ahead restore. Try again shortly.'
      );
    }
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
