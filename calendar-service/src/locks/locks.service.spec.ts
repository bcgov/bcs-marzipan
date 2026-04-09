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

  describe('releaseLockOrFinalizePendingHandoff', () => {
    const baseLock = {
      id: 7,
      entityType: 'activity',
      entityId: 42,
      userId: 100,
      username: 'holder',
      sessionId: null,
      acquiredAt: new Date(),
      expiresAt: new Date(Date.now() + 300_000),
      lastRenewedAt: new Date(),
      lastActivityAt: new Date(),
      idleExpiresAt: new Date(Date.now() + 300_000),
    };

    it('finalizes handoff and does not call releaseLock when the lock row is gone after handoff', async () => {
      const getLockById = vi
        .fn()
        .mockResolvedValueOnce({ ...baseLock })
        .mockResolvedValueOnce(null);
      const completeHandoff = vi.fn().mockResolvedValue(undefined);
      const releaseLock = vi.fn();

      const localModule = await Test.createTestingModule({
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

      const localService = localModule.get(LocksService);
      vi.spyOn(localService, 'getLockById').mockImplementation(getLockById);
      vi.spyOn(
        localService,
        'completeHandoffAfterHolderSaveIfPending'
      ).mockImplementation(completeHandoff);
      vi.spyOn(localService, 'releaseLock').mockImplementation(releaseLock);

      const result = await localService.releaseLockOrFinalizePendingHandoff(
        7,
        100
      );

      expect(result).toBeNull();
      expect(completeHandoff).toHaveBeenCalledWith(42, 100);
      expect(releaseLock).not.toHaveBeenCalled();
    });

    it('calls releaseLock when no handoff removed the lock', async () => {
      const released = { ...baseLock, entityId: 42 };
      const getLockById = vi
        .fn()
        .mockResolvedValueOnce({ ...baseLock })
        .mockResolvedValueOnce({ ...baseLock });
      const completeHandoff = vi.fn().mockResolvedValue(undefined);
      const releaseLock = vi.fn().mockResolvedValue(released);

      const localModule = await Test.createTestingModule({
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

      const localService = localModule.get(LocksService);
      vi.spyOn(localService, 'getLockById').mockImplementation(getLockById);
      vi.spyOn(
        localService,
        'completeHandoffAfterHolderSaveIfPending'
      ).mockImplementation(completeHandoff);
      vi.spyOn(localService, 'releaseLock').mockImplementation(releaseLock);

      const result = await localService.releaseLockOrFinalizePendingHandoff(
        7,
        100
      );

      expect(result).toEqual(released);
      expect(completeHandoff).toHaveBeenCalledWith(42, 100);
      expect(releaseLock).toHaveBeenCalledWith(7, 100);
    });

    it('returns null when the user does not hold the lock', async () => {
      const getLockById = vi.fn().mockResolvedValue(null);
      const releaseLock = vi.fn();

      const localModule = await Test.createTestingModule({
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

      const localService = localModule.get(LocksService);
      vi.spyOn(localService, 'getLockById').mockImplementation(getLockById);
      vi.spyOn(localService, 'releaseLock').mockImplementation(releaseLock);

      const result = await localService.releaseLockOrFinalizePendingHandoff(
        7,
        100
      );

      expect(result).toBeNull();
      expect(releaseLock).not.toHaveBeenCalled();
    });

    it('skips handoff finalization for non-activity entity types', async () => {
      const otherLock = { ...baseLock, entityType: 'other', entityId: 1 };
      const getLockById = vi
        .fn()
        .mockResolvedValueOnce(otherLock)
        .mockResolvedValueOnce(otherLock);
      const completeHandoff = vi.fn();
      const releaseLock = vi.fn().mockResolvedValue(otherLock);

      const localModule = await Test.createTestingModule({
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

      const localService = localModule.get(LocksService);
      vi.spyOn(localService, 'getLockById').mockImplementation(getLockById);
      vi.spyOn(
        localService,
        'completeHandoffAfterHolderSaveIfPending'
      ).mockImplementation(completeHandoff);
      vi.spyOn(localService, 'releaseLock').mockImplementation(releaseLock);

      await localService.releaseLockOrFinalizePendingHandoff(7, 100);

      expect(completeHandoff).not.toHaveBeenCalled();
      expect(releaseLock).toHaveBeenCalledWith(7, 100);
    });
  });
});
