import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ActivitiesGateway } from '../activities/activities.gateway';
import { DatabaseService } from '../database/database.service';
import { ApplicationSettingsService } from './application-settings.service';
import { LockHandoffDeadlineKickService } from './lock-handoff-deadline-kick.service';
import { LocksService } from './locks.service';

describe('LocksService', () => {
  const notifyLockHandoffCancelled = vi.fn();
  const notifyLockHandoffPending = vi.fn();
  const notifyLockHandoffResolved = vi.fn();
  const notifyLockReleased = vi.fn();
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
          useValue: {
            notifyLockHandoffCancelled,
            notifyLockHandoffPending,
            notifyLockHandoffResolved,
            notifyLockReleased,
          },
        },
        {
          provide: LockHandoffDeadlineKickService,
          useValue: { clearScheduledKick, scheduleHandoffKick },
        },
      ],
    }).compile();

    service = module.get(LocksService);

    vi.spyOn(
      LocksService.prototype as unknown as {
        getLockUsernameForUserId: (...args: unknown[]) => Promise<string>;
      },
      'getLockUsernameForUserId'
    ).mockImplementation((...args: unknown[]) =>
      Promise.resolve(`User-${String(args[0])}`)
    );
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
      expect(notifyLockHandoffResolved).toHaveBeenCalledWith(10, {
        activityId: 5,
        outcome: 'cancelled',
        role: 'holder',
        counterpartUsername: 'User-20',
      });
      expect(notifyLockHandoffResolved).toHaveBeenCalledWith(20, {
        activityId: 5,
        outcome: 'cancelled',
        role: 'requester',
        counterpartUsername: 'User-10',
      });
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

  describe('requestForceHandoff', () => {
    const heldLock = {
      id: 1,
      entityType: 'activity',
      entityId: 99,
      userId: 10,
      username: 'Holder',
      sessionId: null,
      acquiredAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      lastRenewedAt: new Date(),
      lastActivityAt: new Date(),
      idleExpiresAt: new Date(Date.now() + 60_000),
    };

    it('throws ConflictException when there is no active lock', async () => {
      vi.spyOn(service, 'getLockForEntity').mockResolvedValue(null);

      await expect(
        service.requestForceHandoff(99, 20, 'Admin')
      ).rejects.toThrow(ConflictException);
      expect(notifyLockHandoffPending).not.toHaveBeenCalled();
      expect(scheduleHandoffKick).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the requester already holds the lock', async () => {
      vi.spyOn(service, 'getLockForEntity').mockResolvedValue({
        ...heldLock,
        userId: 20,
      });

      await expect(
        service.requestForceHandoff(99, 20, 'Admin')
      ).rejects.toThrow(ConflictException);
      expect(notifyLockHandoffPending).not.toHaveBeenCalled();
    });

    it('throws ConflictException when a pending handoff already exists', async () => {
      vi.spyOn(service, 'getLockForEntity').mockResolvedValue(heldLock);

      const selectLimit = vi.fn().mockResolvedValue([{ id: 5 }]);
      const selectWhere = vi.fn().mockReturnValue({ limit: selectLimit });
      const selectFrom = vi.fn().mockReturnValue({ where: selectWhere });
      const db = {
        transaction,
        select: vi.fn().mockReturnValue({ from: selectFrom }),
      };
      const moduleWithSelect: TestingModule = await Test.createTestingModule({
        providers: [
          LocksService,
          { provide: DatabaseService, useValue: { db } },
          { provide: ApplicationSettingsService, useValue: {} },
          {
            provide: ActivitiesGateway,
            useValue: { notifyLockHandoffCancelled, notifyLockHandoffPending },
          },
          {
            provide: LockHandoffDeadlineKickService,
            useValue: { clearScheduledKick, scheduleHandoffKick },
          },
        ],
      }).compile();
      const svc = moduleWithSelect.get(LocksService);
      vi.spyOn(svc, 'getLockForEntity').mockResolvedValue(heldLock);

      await expect(svc.requestForceHandoff(99, 20, 'Admin')).rejects.toThrow(
        ConflictException
      );
      expect(notifyLockHandoffPending).not.toHaveBeenCalled();
    });

    it('creates pending handoff, notifies both parties, and schedules kick', async () => {
      const selectLimit = vi.fn().mockResolvedValue([]);
      const selectWhere = vi.fn().mockReturnValue({ limit: selectLimit });
      const selectFrom = vi.fn().mockReturnValue({ where: selectWhere });
      const returning = vi
        .fn()
        .mockResolvedValue([
          { id: 42, activityId: 99, fromUserId: 10, toUserId: 20 },
        ]);
      const values = vi.fn().mockReturnValue({ returning });
      const insert = vi.fn().mockReturnValue({ values });

      const db = {
        transaction,
        select: vi.fn().mockReturnValue({ from: selectFrom }),
        insert,
      };

      const moduleWithInsert: TestingModule = await Test.createTestingModule({
        providers: [
          LocksService,
          { provide: DatabaseService, useValue: { db } },
          { provide: ApplicationSettingsService, useValue: {} },
          {
            provide: ActivitiesGateway,
            useValue: { notifyLockHandoffCancelled, notifyLockHandoffPending },
          },
          {
            provide: LockHandoffDeadlineKickService,
            useValue: { clearScheduledKick, scheduleHandoffKick },
          },
        ],
      }).compile();
      const svc = moduleWithInsert.get(LocksService);
      vi.spyOn(svc, 'getLockForEntity').mockResolvedValue(heldLock);

      const result = await svc.requestForceHandoff(99, 20, 'Requester');

      expect(result.pendingHandoffId).toBe(42);
      expect(typeof result.graceEndsAt).toBe('string');
      expect(notifyLockHandoffPending).toHaveBeenCalledTimes(2);
      expect(notifyLockHandoffPending).toHaveBeenCalledWith(10, {
        activityId: 99,
        graceEndsAt: result.graceEndsAt,
        counterpartUsername: 'Requester',
        role: 'holder',
      });
      expect(notifyLockHandoffPending).toHaveBeenCalledWith(20, {
        activityId: 99,
        graceEndsAt: result.graceEndsAt,
        counterpartUsername: 'Holder',
        role: 'requester',
      });
      expect(scheduleHandoffKick).toHaveBeenCalledWith(99, expect.any(Date));
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
      const completeHandoff = vi.fn().mockResolvedValue(true);
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

      expect(result).toEqual({ kind: 'handoffFinalized' });
      expect(completeHandoff).toHaveBeenCalledWith(42, 100);
      expect(releaseLock).not.toHaveBeenCalled();
    });

    it('calls releaseLock when no handoff removed the lock', async () => {
      const released = { ...baseLock, entityId: 42 };
      const getLockById = vi
        .fn()
        .mockResolvedValueOnce({ ...baseLock })
        .mockResolvedValueOnce({ ...baseLock });
      const completeHandoff = vi.fn().mockResolvedValue(false);
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

      expect(result).toEqual({ kind: 'released', lock: released });
      expect(completeHandoff).toHaveBeenCalledWith(42, 100);
      expect(releaseLock).toHaveBeenCalledWith(7, 100);
    });

    it('returns notFound when lock disappears after recheck without a finalized handoff', async () => {
      const getLockById = vi
        .fn()
        .mockResolvedValueOnce({ ...baseLock })
        .mockResolvedValueOnce(null);
      const completeHandoff = vi.fn().mockResolvedValue(false);
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

      expect(result).toEqual({ kind: 'notFound' });
      expect(completeHandoff).toHaveBeenCalledWith(42, 100);
      expect(releaseLock).not.toHaveBeenCalled();
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

      expect(result).toEqual({ kind: 'notFound' });
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

  describe('releaseLocksAndCancelHandoffsAfterLastWsDisconnect', () => {
    const lockRow = {
      id: 7,
      entityType: 'activity',
      entityId: 42,
      userId: 99,
      username: 'u',
      sessionId: null,
      acquiredAt: new Date(),
      expiresAt: new Date(Date.now() + 300_000),
      lastRenewedAt: new Date(),
      lastActivityAt: new Date(),
      idleExpiresAt: new Date(Date.now() + 300_000),
    };

    it('cancels all pending handoffs for requester and releases their locks', async () => {
      const handoffDeleteReturning = vi
        .fn()
        .mockResolvedValue([{ activityId: 5, fromUserId: 10, toUserId: 99 }]);
      const dbDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: handoffDeleteReturning,
        }),
      });
      const dbSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([lockRow]),
        }),
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LocksService,
          {
            provide: DatabaseService,
            useValue: {
              db: { transaction, delete: dbDelete, select: dbSelect },
            },
          },
          { provide: ApplicationSettingsService, useValue: {} },
          {
            provide: ActivitiesGateway,
            useValue: {
              notifyLockHandoffCancelled,
              notifyLockHandoffPending,
              notifyLockHandoffResolved,
              notifyLockReleased,
            },
          },
          {
            provide: LockHandoffDeadlineKickService,
            useValue: { clearScheduledKick, scheduleHandoffKick },
          },
        ],
      }).compile();

      const localService = module.get(LocksService);
      const releaseOrFinalizeSpy = vi
        .spyOn(localService, 'releaseLockOrFinalizePendingHandoff')
        .mockResolvedValue({
          kind: 'released',
          lock: { ...lockRow },
        });

      await localService.releaseLocksAndCancelHandoffsAfterLastWsDisconnect(99);

      expect(handoffDeleteReturning).toHaveBeenCalled();
      expect(clearScheduledKick).toHaveBeenCalledWith(5);
      expect(notifyLockHandoffCancelled).toHaveBeenCalledWith(5, 10, 99);
      expect(notifyLockHandoffResolved).toHaveBeenCalledWith(10, {
        activityId: 5,
        outcome: 'cancelled',
        role: 'holder',
        counterpartUsername: 'User-99',
      });
      expect(notifyLockHandoffResolved).toHaveBeenCalledWith(99, {
        activityId: 5,
        outcome: 'cancelled',
        role: 'requester',
        counterpartUsername: 'User-10',
      });
      expect(releaseOrFinalizeSpy).toHaveBeenCalledWith(7, 99);
      expect(notifyLockReleased).toHaveBeenCalledWith(42);
    });

    it('does not notify lock released when release finalizes handoff only', async () => {
      const dbDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });
      const dbSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([lockRow]),
        }),
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LocksService,
          {
            provide: DatabaseService,
            useValue: {
              db: { transaction, delete: dbDelete, select: dbSelect },
            },
          },
          { provide: ApplicationSettingsService, useValue: {} },
          {
            provide: ActivitiesGateway,
            useValue: {
              notifyLockHandoffCancelled,
              notifyLockHandoffPending,
              notifyLockHandoffResolved,
              notifyLockReleased,
            },
          },
          {
            provide: LockHandoffDeadlineKickService,
            useValue: { clearScheduledKick, scheduleHandoffKick },
          },
        ],
      }).compile();

      const localService = module.get(LocksService);
      vi.spyOn(
        localService,
        'releaseLockOrFinalizePendingHandoff'
      ).mockResolvedValue({ kind: 'handoffFinalized' });

      await localService.releaseLocksAndCancelHandoffsAfterLastWsDisconnect(99);

      expect(notifyLockReleased).not.toHaveBeenCalled();
    });
  });
});
