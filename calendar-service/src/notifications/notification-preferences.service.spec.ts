import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseService } from '../database/database.service';
import { NotificationPreferencesService } from './notification-preferences.service';

function createSelectChain(result: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn(),
    limit: vi.fn().mockResolvedValue(result),
  };
  // `where` is terminal for the preference query and chained for the user query.
  chain.where.mockImplementation(() =>
    Object.assign(Promise.resolve(result), { limit: chain.limit })
  );
  return chain;
}

describe('NotificationPreferencesService', () => {
  const select = vi.fn();
  const db = { select, transaction: vi.fn() };
  let service: NotificationPreferencesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotificationPreferencesService({
      db,
    } as unknown as DatabaseService);
  });

  describe('getForUser', () => {
    it('defaults missing categories to enabled and merges stored rows', async () => {
      select
        .mockReturnValueOnce(
          createSelectChain([{ enableEmailNotification: false }])
        )
        .mockReturnValueOnce(
          createSelectChain([
            {
              category: 'activity_reminders',
              inAppEnabled: false,
              emailEnabled: true,
            },
          ])
        );

      const result = await service.getForUser(5);

      expect(result.emailEnabled).toBe(false);
      expect(result.categories).toHaveLength(6);
      expect(
        result.categories.find((c) => c.category === 'activity_reminders')
      ).toEqual({ category: 'activity_reminders', inApp: false, email: true });
      expect(
        result.categories
          .filter((c) => c.category !== 'activity_reminders')
          .every((c) => c.inApp && c.email)
      ).toBe(true);
    });

    it('throws when the user does not exist', async () => {
      select
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));

      await expect(service.getForUser(5)).rejects.toBeInstanceOf(
        NotFoundException
      );
    });
  });

  describe('resolveOptOuts', () => {
    it('returns empty sets for unmapped event types without querying', async () => {
      const result = await service.resolveOptOuts('calendar.unknown', [1, 2]);

      expect(select).not.toHaveBeenCalled();
      expect(result.inApp.size).toBe(0);
      expect(result.email.size).toBe(0);
    });

    it('returns empty sets without querying when there are no users', async () => {
      await service.resolveOptOuts('calendar.activity.updated', []);
      expect(select).not.toHaveBeenCalled();
    });

    it('splits opt-outs by channel', async () => {
      select.mockReturnValueOnce(
        createSelectChain([
          { userId: 1, inAppEnabled: false, emailEnabled: true },
          { userId: 2, inAppEnabled: true, emailEnabled: false },
          { userId: 3, inAppEnabled: false, emailEnabled: false },
        ])
      );

      const result = await service.resolveOptOuts(
        'calendar.activity.updated',
        [1, 2, 3, 4]
      );

      expect([...result.inApp].sort()).toEqual([1, 3]);
      expect([...result.email].sort()).toEqual([2, 3]);
    });
  });
});
