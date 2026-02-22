import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '@corpcal/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LocksService } from './locks.service';
import { acquireLockBodySchema, type AcquireLockBody } from './dto/acquire-lock.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('locks')
@Controller('locks')
@UseGuards(JwtAuthGuard)
export class LocksController {
  constructor(private readonly locksService: LocksService) {}

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
    const lock = await this.locksService.tryAcquireLock(
      body.entityType,
      body.entityId,
      user.id,
      user.displayName ?? `User ${user.id}`,
      body.lockSessionId
    );
    return {
      id: lock.id,
      entityType: lock.entityType,
      entityId: lock.entityId,
      userId: lock.userId,
      username: lock.username,
      acquiredAt: lock.acquiredAt,
      expiresAt: lock.expiresAt,
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
    const lock = await this.locksService.getLockForEntity('activity', activityId);
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
      },
    };
  }

  @Delete(':lockId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Release a lock' })
  @ApiParam({ name: 'lockId', type: Number })
  @ApiResponse({ status: 204, description: 'Lock released' })
  @ApiResponse({ status: 404, description: 'Lock not found or not owner' })
  async release(
    @Param('lockId', ParseIntPipe) lockId: number,
    @CurrentUser() user: AuthUser
  ) {
    const released = await this.locksService.releaseLock(lockId, user.id);
    if (!released) {
      return; // 204 anyway for idempotency
    }
  }
}
