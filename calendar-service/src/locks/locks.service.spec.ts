import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ActivitiesGateway } from '../activities/activities.gateway';
import { DatabaseService } from '../database/database.service';
import { ApplicationSettingsService } from './application-settings.service';
import { LockHandoffDeadlineKickService } from './lock-handoff-deadline-kick.service';
import { LocksService } from './locks.service';

describe('LocksService', () => {
  const notifyLockHandoffCancelled = vi.fn();
  const transaction = vi.fn();
  const clearScheduledKick = vi.fn();
  const scheduleHandoffKick = vi.fn();

  let service: LocksService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocksService,
        {
          provide: DatabaseService,
          useValue: { db: { transaction } },
        },
        { provide: ApplicationSettingsService, useValue: {} },
        {
          provide: ActivitiesGateway,
          useValue: { notifyLockHandoffCancelled },
        },
        {
          provide: LockHandoffDeadlineKickService,
          useValue: { clearScheduledKick, scheduleHandoffKick },
        },
      ],
    }).compile();

    service = module.get(LocksService);
  });

  describe('cancelForceHandoff', () => {
    it('removes pending handoff for requester and notifies holder and requester', async () => {
      const mockRow = { fromUserId: 10, toUserId: 20 };
      transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            delete: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockRow]),
              }),
            }),
          };
          return fn(tx);
        }
      );

      await service.cancelForceHandoff(5, 20);

      expect(clearScheduledKick).toHaveBeenCalledWith(5);
      expect(notifyLockHandoffCancelled).toHaveBeenCalledWith(5, 10, 20);
    });

    it('throws NotFoundException when no pending handoff for this requester', async () => {
      transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            delete: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([]),
              }),
            }),
          };
          return fn(tx);
        }
      );

      await expect(service.cancelForceHandoff(5, 99)).rejects.toThrow(
        NotFoundException
      );
      expect(notifyLockHandoffCancelled).not.toHaveBeenCalled();
    });
  });
});
