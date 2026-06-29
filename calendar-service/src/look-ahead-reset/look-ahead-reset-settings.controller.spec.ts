import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type AuthUser } from '@corpcal/shared';

import { ApplicationSettingsService } from '../locks/application-settings.service';
import { LookAheadResetJobService } from './look-ahead-reset-job.service';
import { LookAheadResetSettingsController } from './look-ahead-reset-settings.controller';

describe('LookAheadResetSettingsController', () => {
  let controller: LookAheadResetSettingsController;

  const mockApplicationSettings = {
    getLookAheadResetWindowDays: vi.fn(),
    getLookAheadResetCronMode: vi.fn(),
    setLookAheadResetWindowDays: vi.fn(),
    setLookAheadResetCronMode: vi.fn(),
  };

  const mockLookAheadResetJob = {
    isRollbackAvailable: vi.fn(),
    getLastClearSummary: vi.fn(),
    runBatch: vi.fn(),
    rollbackLastClear: vi.fn(),
    previewEligibleActivities: vi.fn(),
  };

  const user: AuthUser = {
    id: 7,
    username: 'admin',
    displayName: 'Admin',
    email: 'admin@example.com',
    roleId: 6,
    roleName: 'System Admin',
    permissions: [],
    teamIds: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new LookAheadResetSettingsController(
      mockApplicationSettings as unknown as ApplicationSettingsService,
      mockLookAheadResetJob as unknown as LookAheadResetJobService
    );
  });

  it('passes pauseScheduledTonight to runBatch', async () => {
    mockLookAheadResetJob.runBatch.mockResolvedValue({
      updated: 3,
      skipped: false,
      scheduledRunPausedTonight: true,
    });

    const result = await controller.runNow(user, {
      scope: 'window',
      days: 7,
      pauseScheduledTonight: true,
    });

    expect(mockLookAheadResetJob.runBatch).toHaveBeenCalledWith({
      actorUserId: 7,
      trigger: 'manual',
      pauseScheduledTonight: true,
      manual: {
        scope: 'window',
        days: 7,
        includePast: false,
      },
    });
    expect(result).toEqual({
      success: true,
      data: {
        updated: 3,
        skipped: false,
        scheduledRunPausedTonight: true,
      },
    });
  });

  it('throws ConflictException when rollback is skipped due to in_flight', async () => {
    mockLookAheadResetJob.isRollbackAvailable.mockResolvedValue(true);
    mockLookAheadResetJob.rollbackLastClear.mockResolvedValue({
      restored: 0,
      skipped: 0,
      rollbackAvailable: true,
      skippedRollback: true,
      skipReason: 'in_flight',
    });

    await expect(controller.rollback(user)).rejects.toBeInstanceOf(
      ConflictException
    );
  });

  it('throws ConflictException when rollback is skipped due to advisory_lock', async () => {
    mockLookAheadResetJob.isRollbackAvailable.mockResolvedValue(true);
    mockLookAheadResetJob.rollbackLastClear.mockResolvedValue({
      restored: 0,
      skipped: 0,
      rollbackAvailable: true,
      skippedRollback: true,
      skipReason: 'advisory_lock',
    });

    await expect(controller.rollback(user)).rejects.toThrow(
      'Another instance is running the Look Ahead restore'
    );
  });

  it('returns rollback result when restore succeeds', async () => {
    mockLookAheadResetJob.isRollbackAvailable.mockResolvedValue(true);
    mockLookAheadResetJob.rollbackLastClear.mockResolvedValue({
      restored: 2,
      skipped: 0,
      rollbackAvailable: false,
    });

    const result = await controller.rollback(user);

    expect(result).toEqual({
      success: true,
      data: {
        restored: 2,
        skipped: 0,
        rollbackAvailable: false,
      },
    });
  });
});
