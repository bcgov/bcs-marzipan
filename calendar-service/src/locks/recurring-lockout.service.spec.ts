import { HttpException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@corpcal/shared';

import { DatabaseService } from '../database/database.service';
import { PolicyService } from '../policy/policy.service';
import { RecurringLockoutService } from './recurring-lockout.service';

describe('RecurringLockoutService', () => {
  const mockSelect = vi.fn();
  const getEffectivePermissionsForUserMock = vi.fn();

  const mockDatabaseService = {
    db: {
      select: mockSelect,
    },
  } as unknown as DatabaseService;

  const mockPolicyService = {
    getEffectivePermissionsForUser: getEffectivePermissionsForUserMock,
  } as unknown as PolicyService;

  const service = new RecurringLockoutService(
    mockDatabaseService,
    mockPolicyService
  );

  function mockSettingsQuery(settings: {
    isActive: boolean;
    startTimeOfDay: string;
    endTimeOfDay: string;
  }) {
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([settings]),
    });
  }

  it('throws HttpException with reason time_lockout for users without bypass permission', async () => {
    mockSettingsQuery({
      isActive: true,
      startTimeOfDay: '09:00',
      endTimeOfDay: '10:00',
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T16:00:00.000Z'));

    await expect(
      service.assertUserCanEditDuringLockout(1, [PERMISSIONS.ACTIVITIES.EDIT])
    ).rejects.toSatisfy((err: unknown) => {
      if (!(err instanceof HttpException)) {
        return false;
      }
      const body = err.getResponse() as { reason?: string };
      return err.getStatus() === 403 && body.reason === 'time_lockout';
    });

    vi.useRealTimers();
  });

  it('allows users with bypass permission during the lockout window', async () => {
    mockSettingsQuery({
      isActive: true,
      startTimeOfDay: '09:00',
      endTimeOfDay: '10:00',
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T16:00:00.000Z'));

    await expect(
      service.assertUserCanEditDuringLockout(1, [
        PERMISSIONS.ACTIVITIES.BYPASS_RECURRING_LOCKOUT,
      ])
    ).resolves.toBeUndefined();

    vi.useRealTimers();
  });

  it('allows edits at end boundary because end time is exclusive', async () => {
    mockSettingsQuery({
      isActive: true,
      startTimeOfDay: '09:00',
      endTimeOfDay: '10:00',
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T17:00:00.000Z'));

    await expect(
      service.assertUserCanEditDuringLockout(1, [PERMISSIONS.ACTIVITIES.EDIT])
    ).resolves.toBeUndefined();

    vi.useRealTimers();
  });
});
