import { HttpException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { SYSTEM_ROLE_IDS } from '@corpcal/shared';

import { DatabaseService } from '../database/database.service';
import { RecurringLockoutService } from './recurring-lockout.service';

describe('RecurringLockoutService', () => {
  const mockSelect = vi.fn();

  const mockDatabaseService = {
    db: {
      select: mockSelect,
    },
  } as unknown as DatabaseService;

  const service = new RecurringLockoutService(mockDatabaseService);

  function mockSettingsQuery(settings: {
    isActive: boolean;
    startTimeOfDay: string;
    endTimeOfDay: string;
    exemptRoleIds: number[];
  }) {
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([settings]),
    });
  }

  it('throws HttpException with reason time_lockout for blocked roles', async () => {
    mockSettingsQuery({
      isActive: true,
      startTimeOfDay: '09:00',
      endTimeOfDay: '10:00',
      exemptRoleIds: [],
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T16:00:00.000Z'));

    await expect(
      service.assertRoleCanEditDuringLockout(SYSTEM_ROLE_IDS.EDITOR)
    ).rejects.toSatisfy((err: unknown) => {
      if (!(err instanceof HttpException)) {
        return false;
      }
      const body = err.getResponse() as { reason?: string };
      return err.getStatus() === 403 && body.reason === 'time_lockout';
    });

    vi.useRealTimers();
  });

  it('allows edits at end boundary because end time is exclusive', async () => {
    mockSettingsQuery({
      isActive: true,
      startTimeOfDay: '09:00',
      endTimeOfDay: '10:00',
      exemptRoleIds: [],
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T17:00:00.000Z'));

    await expect(
      service.assertRoleCanEditDuringLockout(SYSTEM_ROLE_IDS.EDITOR)
    ).resolves.toBeUndefined();

    vi.useRealTimers();
  });
});
