import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { desc } from 'drizzle-orm';

import { recurringLockoutBannerSettings } from '@corpcal/database/schema';
import {
  PERMISSIONS,
  SYSTEM_ROLE_IDS,
  toPacificHourMinute,
  type AuthUser,
} from '@corpcal/shared';
import { DEFAULT_RECURRING_EDIT_LOCKOUT_EXEMPT_ROLE_IDS } from '@corpcal/shared/schemas';

import { ActivitiesGateway } from '../activities/activities.gateway';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { DatabaseService } from '../database/database.service';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { ApplicationSettingsService } from './application-settings.service';
import {
  acquireLockBodySchema,
  type AcquireLockBody,
} from './dto/acquire-lock.dto';
import {
  patchIdleTimeoutConfigSchema,
  type PatchIdleTimeoutConfigBody,
} from './dto/idle-timeout-config.dto';
import { LocksService } from './locks.service';

@ApiTags('locks')
@Controller('locks')
@UseGuards(JwtAuthGuard)
export class LocksController {
  constructor(
    private readonly locksService: LocksService,
    private readonly databaseService: DatabaseService,
    private readonly applicationSettings: ApplicationSettingsService,
    private readonly activitiesGateway: ActivitiesGateway
  ) {}

  private timeToMinutes(timeOfDay: string): number {
    const [hour, minute] = timeOfDay.split(':').map(Number);
    return hour * 60 + minute;
  }

  private async ensureUserCanAcquireActivityLock(
    user: AuthUser
  ): Promise<void> {
    const [settings] = await this.databaseService.db
      .select({
        isActive: recurringLockoutBannerSettings.isActive,
        startTimeOfDay: recurringLockoutBannerSettings.startTimeOfDay,
        endTimeOfDay: recurringLockoutBannerSettings.endTimeOfDay,
        exemptRoleIds: recurringLockoutBannerSettings.exemptRoleIds,
      })
      .from(recurringLockoutBannerSettings)
      .orderBy(
        desc(recurringLockoutBannerSettings.lastUpdatedDateTime),
        desc(recurringLockoutBannerSettings.id)
      )
      .limit(1);

    if (!settings || !settings.isActive) {
      return;
    }

    const { hour, minute } = toPacificHourMinute(Date.now());
    const currentMinutes = hour * 60 + minute;
    const startMinutes = this.timeToMinutes(settings.startTimeOfDay);
    const endMinutes = this.timeToMinutes(settings.endTimeOfDay);

    if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
      return;
    }

    const exemptRoleIds = Array.isArray(settings.exemptRoleIds)
      ? settings.exemptRoleIds
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0)
      : [...DEFAULT_RECURRING_EDIT_LOCKOUT_EXEMPT_ROLE_IDS];

    if (exemptRoleIds.includes(user.roleId)) {
      return;
    }

    throw new ForbiddenException(
      'Editing activities is locked for the current lockout window.'
    );
  }

  private ensureSystemAdmin(user: AuthUser): void {
    if (user.roleId !== SYSTEM_ROLE_IDS.SYSTEM_ADMIN) {
      throw new ForbiddenException(
        'Only System Admin users can change this setting.'
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Acquire a lock on an entity (e.g. activity)' })
  @ApiResponse({ status: 200, description: 'Lock acquired' })
  @ApiResponse({ status: 423, description: 'Already locked by another user' })
  async acquire(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(acquireLockBodySchema)) body: AcquireLockBody
  ) {
    if (body.entityType !== 'activity') {
      return { locked: false, message: 'Only activity locks are supported.' };
    }

    await this.ensureUserCanAcquireActivityLock(user);

    const lock = await this.locksService.tryAcquireLock(
      body.entityType,
      body.entityId,
      user.id,
      user.displayName ?? `User ${user.id}`,
      body.lockSessionId
    );

    this.activitiesGateway.notifyLockAcquired(body.entityId, {
      userId: lock.userId,
      username: lock.username,
    });

    return {
      id: lock.id,
      entityType: lock.entityType,
      entityId: lock.entityId,
      userId: lock.userId,
      username: lock.username,
      acquiredAt: lock.acquiredAt,
      expiresAt: lock.expiresAt,
      idleExpiresAt: lock.idleExpiresAt,
    };
  }

  @Get('activity/:activityId')
  @ApiOperation({ summary: 'Get lock status for an activity' })
  @ApiParam({ name: 'activityId', type: Number })
  @ApiResponse({ status: 200, description: 'Lock status' })
  async getActivityLockStatus(
    @Param('activityId', ParseIntPipe) activityId: number,
    @CurrentUser() user: AuthUser
  ) {
    const lock = await this.locksService.getLockForEntity(
      'activity',
      activityId
    );
    if (!lock) {
      return { locked: false };
    }
    return {
      locked: true,
      isOwnLock: lock.userId === user.id,
      lockId: lock.id,
      lockedBy: {
        userId: lock.userId,
        username: lock.username,
        acquiredAt: lock.acquiredAt,
        expiresAt: lock.expiresAt,
        idleExpiresAt: lock.idleExpiresAt,
      },
    };
  }

  @Post('activity/:activityId/force-handoff')
  @ApiOperation({
    summary:
      'Request transfer of the edit lock to yourself after a grace period (requires permission)',
  })
  @RequirePermission(PERMISSIONS.ACTIVITIES.LOCK_FORCE_HANDOFF)
  @ApiParam({ name: 'activityId', type: Number })
  async forceHandoff(
    @Param('activityId', ParseIntPipe) activityId: number,
    @CurrentUser() user: AuthUser
  ) {
    return this.locksService.requestForceHandoff(
      activityId,
      user.id,
      user.displayName ?? user.username
    );
  }

  @Delete('activity/:activityId/force-handoff')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Cancel a pending force handoff (only the user who requested it; requires permission)',
  })
  @RequirePermission(PERMISSIONS.ACTIVITIES.LOCK_FORCE_HANDOFF)
  @ApiParam({ name: 'activityId', type: Number })
  @ApiResponse({ status: 204, description: 'Pending handoff cancelled' })
  @ApiResponse({
    status: 404,
    description: 'No pending handoff for this activity as requester',
  })
  async cancelForceHandoff(
    @Param('activityId', ParseIntPipe) activityId: number,
    @CurrentUser() user: AuthUser
  ): Promise<void> {
    await this.locksService.cancelForceHandoff(activityId, user.id);
  }

  @Post('heartbeat/:lockId')
  @ApiOperation({ summary: 'Extend idle deadline while holding a lock' })
  @ApiParam({ name: 'lockId', type: Number })
  async heartbeat(
    @Param('lockId', ParseIntPipe) lockId: number,
    @CurrentUser() user: AuthUser
  ) {
    return this.locksService.heartbeatLock(lockId, user.id);
  }

  @Get('idle-timeout-config')
  @ApiOperation({ summary: 'Global edit lock idle timeout (minutes)' })
  async getIdleTimeoutConfig() {
    const idleTimeoutMinutes =
      await this.applicationSettings.getEditLockIdleTimeoutMinutes();
    return { success: true, data: { idleTimeoutMinutes } };
  }

  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE)
  @Patch('idle-timeout-config')
  @ApiOperation({
    summary: 'Update global edit lock idle timeout (System Admin only)',
  })
  async patchIdleTimeoutConfig(
    @Body(new ZodValidationPipe(patchIdleTimeoutConfigSchema))
    body: PatchIdleTimeoutConfigBody,
    @CurrentUser() user: AuthUser
  ) {
    this.ensureSystemAdmin(user);
    await this.applicationSettings.setEditLockIdleTimeoutMinutes(
      body.idleTimeoutMinutes
    );
    return {
      success: true,
      data: { idleTimeoutMinutes: body.idleTimeoutMinutes },
    };
  }

  @Delete(':lockId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Release a lock' })
  @ApiParam({ name: 'lockId', type: Number })
  @ApiResponse({
    status: 204,
    description: 'Lock released (idempotent when lock is absent or not owned)',
  })
  async release(
    @Param('lockId', ParseIntPipe) lockId: number,
    @CurrentUser() user: AuthUser
  ) {
    const result = await this.locksService.releaseLockOrFinalizePendingHandoff(
      lockId,
      user.id
    );
    if (result.kind === 'notFound') return;
    if (result.kind === 'released' && result.lock.entityType === 'activity') {
      this.activitiesGateway.notifyLockReleased(result.lock.entityId);
    }
  }
}
