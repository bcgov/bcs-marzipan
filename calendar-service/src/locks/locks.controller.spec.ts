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
  const assertRoleCanEditDuringLockoutMock = vi.fn();

  const mockLocksService = {
    tryAcquireLock: tryAcquireLockMock,
  } as unknown as LocksService;

  const mockRecurringLockoutService = {
    assertRoleCanEditDuringLockout: assertRoleCanEditDuringLockoutMock,
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

  it('returns 403 with reason time_lockout for non-exempt users during lockout window', async () => {
    assertRoleCanEditDuringLockoutMock.mockRejectedValue(
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
  });

  it('allows acquire at lockout end boundary (end time is exclusive)', async () => {
    assertRoleCanEditDuringLockoutMock.mockResolvedValue(undefined);

    tryAcquireLockMock.mockResolvedValue({
      id: 100,
      entityType: 'activity',
      entityId: 22,
      userId: 7,
      username: 'Editor Seven',
      acquiredAt: new Date(),
      expiresAt: new Date(),
      idleExpiresAt: new Date(),
    });

    const result = await controller.acquire(user, {
      entityType: 'activity',
      entityId: 22,
    });

    expect(result).toMatchObject({ id: 100, entityId: 22, userId: 7 });
    expect(tryAcquireLockMock).toHaveBeenCalledTimes(1);
  });
});
