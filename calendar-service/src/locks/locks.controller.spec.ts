import { HttpException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { AuthUser } from '@corpcal/shared';

import { ActivitiesGateway } from '../activities/activities.gateway';
import { ApplicationSettingsService } from './application-settings.service';
import { LocksController } from './locks.controller';
import { LocksService } from './locks.service';
import { RecurringLockoutService } from './recurring-lockout.service';

describe('LocksController', () => {
  const tryAcquireLockMock = vi.fn();
  const getLockForEntityMock = vi.fn();
  const assertUserCanEditDuringLockoutMock = vi.fn();

  const mockLocksService = {
    tryAcquireLock: tryAcquireLockMock,
    getLockForEntity: getLockForEntityMock,
  } as unknown as LocksService;

  const mockRecurringLockoutService = {
    assertUserCanEditDuringLockout: assertUserCanEditDuringLockoutMock,
  } as unknown as RecurringLockoutService;

  const mockSettingsService = {} as ApplicationSettingsService;

  const mockGateway = {
    notifyLockAcquired: vi.fn(),
  } as unknown as ActivitiesGateway;

  const controller = new LocksController(
    mockLocksService,
    mockRecurringLockoutService,
    mockSettingsService,
    mockGateway
  );

  const user: AuthUser = {
    id: 7,
    username: 'editor7',
    displayName: 'Editor Seven',
    email: 'editor7@example.com',
    roleId: 5,
    roleName: 'Editor',
    permissions: [],
    teamIds: [],
  };

  it.each([null, 7, 8])(
    'includes current server time in lock status for owner %s',
    async (ownerId) => {
      getLockForEntityMock.mockImplementation(() => {
        vi.setSystemTime(new Date('2026-11-04T12:00:01.000Z'));
        return ownerId == null
          ? null
          : {
              id: 100,
              userId: ownerId,
              username: 'Editor',
              acquiredAt: new Date('2026-11-04T11:59:00.000Z'),
              expiresAt: new Date('2026-11-04T12:01:00.000Z'),
              idleExpiresAt: new Date('2026-11-04T12:05:00.000Z'),
            };
      });
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-04T12:00:00.000Z'));
      try {
        const result = await controller.getActivityLockStatus(22, user);

        expect(result.serverTime).toBe('2026-11-04T12:00:01.000Z');
        expect(result.locked).toBe(ownerId != null);
        if (ownerId != null) {
          expect(result.isOwnLock).toBe(ownerId === user.id);
        }
        expect(getLockForEntityMock).toHaveBeenCalledWith('activity', 22);
      } finally {
        vi.useRealTimers();
      }
    }
  );

  it('returns 403 with reason time_lockout for users without bypass permission during lockout window', async () => {
    assertUserCanEditDuringLockoutMock.mockRejectedValue(
      new HttpException(
        {
          statusCode: 403,
          message:
            'Editing activities is locked for the current lockout window.',
          reason: 'time_lockout',
        },
        403
      )
    );

    await expect(
      controller.acquire(user, { entityType: 'activity', entityId: 22 })
    ).rejects.toSatisfy((err: unknown) => {
      if (!(err instanceof HttpException)) {
        return false;
      }
      const body = err.getResponse() as { reason?: string };
      return err.getStatus() === 403 && body.reason === 'time_lockout';
    });

    expect(assertUserCanEditDuringLockoutMock).toHaveBeenCalledWith(
      user.id,
      user.permissions
    );
  });

  it('allows acquire at lockout end boundary (end time is exclusive)', async () => {
    assertUserCanEditDuringLockoutMock.mockResolvedValue(undefined);

    tryAcquireLockMock.mockResolvedValue({
      id: 100,
      entityType: 'activity',
      entityId: 22,
      userId: 7,
      username: 'Editor Seven',
      acquiredAt: new Date('2020-01-01T00:00:00.000Z'),
      expiresAt: new Date(),
      idleExpiresAt: new Date(),
    });

    const result = await controller.acquire(user, {
      entityType: 'activity',
      entityId: 22,
    });

    expect(result).toMatchObject({ id: 100, entityId: 22, userId: 7 });
    expect(Date.parse(result.serverTime ?? '')).toBeGreaterThan(
      Date.parse('2020-01-01T00:00:00.000Z')
    );
    expect(tryAcquireLockMock).toHaveBeenCalledTimes(1);
  });
});
