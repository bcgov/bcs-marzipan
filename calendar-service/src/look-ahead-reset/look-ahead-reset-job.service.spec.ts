import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ActivityHistoryService } from '../activities/services/activity-history.service';
import { DatabaseService } from '../database/database.service';
import { ApplicationSettingsService } from '../locks/application-settings.service';
import { LookAheadResetJobService } from './look-ahead-reset-job.service';

describe('LookAheadResetJobService', () => {
  let service: LookAheadResetJobService;
  let databaseService: {
    db: {
      transaction: ReturnType<typeof vi.fn>;
      select: ReturnType<typeof vi.fn>;
    };
  };
  let applicationSettings: {
    getLookAheadResetWindowDays: ReturnType<typeof vi.fn>;
    getLookAheadResetCronSettings: ReturnType<typeof vi.fn>;
    getLookAheadResetCronMode: ReturnType<typeof vi.fn>;
    setLookAheadResetCronMode: ReturnType<typeof vi.fn>;
    clearLookAheadResetPausedForDate: ReturnType<typeof vi.fn>;
  };
  let activityHistoryService: {
    recordLookAheadStatusResetBatch: ReturnType<typeof vi.fn>;
    recordLookAheadStatusChangeBatch: ReturnType<typeof vi.fn>;
  };

  function mockTxLock(acquired: boolean, candidates: unknown[] = []) {
    const selectChain = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    };

    const candidateSelect = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(candidates),
      }),
    };

    let selectCall = 0;
    return {
      execute: vi.fn().mockResolvedValue([{ acquired }]),
      select: vi.fn().mockImplementation(() => {
        selectCall += 1;
        return selectCall === 1 ? candidateSelect : selectChain;
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };
  }

  beforeEach(async () => {
    databaseService = {
      db: {
        transaction: vi.fn(),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      },
    };
    applicationSettings = {
      getLookAheadResetWindowDays: vi.fn().mockResolvedValue(7),
      getLookAheadResetCronSettings: vi.fn().mockResolvedValue({
        cronEnabled: true,
        pausedForDate: null,
      }),
      getLookAheadResetCronMode: vi.fn().mockResolvedValue('running'),
      setLookAheadResetCronMode: vi.fn().mockResolvedValue(undefined),
      clearLookAheadResetPausedForDate: vi.fn().mockResolvedValue(undefined),
    };
    activityHistoryService = {
      recordLookAheadStatusResetBatch: vi.fn(),
      recordLookAheadStatusChangeBatch: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LookAheadResetJobService,
        { provide: DatabaseService, useValue: databaseService },
        {
          provide: ApplicationSettingsService,
          useValue: applicationSettings,
        },
        {
          provide: ActivityHistoryService,
          useValue: activityHistoryService,
        },
      ],
    }).compile();

    service = module.get(LookAheadResetJobService);
  });

  it('returns in_flight when a batch is already running on this pod', async () => {
    let finish!: (value: unknown) => void;
    databaseService.db.transaction.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );

    const first = service.runBatch({
      actorUserId: 999,
      trigger: 'schedule',
    });
    await Promise.resolve();

    const second = await service.runBatch({
      actorUserId: 999,
      trigger: 'schedule',
    });
    expect(second).toEqual({
      updated: 0,
      skipped: true,
      skipReason: 'in_flight',
    });

    finish({ updated: 0, skipped: false });
    await first;
  });

  it('returns advisory_lock and does not read settings when the advisory lock is not acquired', async () => {
    const mockTx = mockTxLock(false);
    databaseService.db.transaction.mockImplementation(
      (fn: (tx: unknown) => unknown) => Promise.resolve(fn(mockTx))
    );

    const result = await service.runBatch({
      actorUserId: 999,
      trigger: 'schedule',
    });

    expect(result).toEqual({
      updated: 0,
      skipped: true,
      skipReason: 'advisory_lock',
    });
    expect(
      applicationSettings.getLookAheadResetWindowDays
    ).not.toHaveBeenCalled();
  });

  it('returns cron_stopped when scheduled job is disabled', async () => {
    applicationSettings.getLookAheadResetCronSettings.mockResolvedValue({
      cronEnabled: false,
      pausedForDate: null,
    });
    const mockTx = mockTxLock(true);
    databaseService.db.transaction.mockImplementation(
      (fn: (tx: unknown) => unknown) => Promise.resolve(fn(mockTx))
    );

    const result = await service.runBatch({
      actorUserId: 999,
      trigger: 'schedule',
    });

    expect(result).toEqual({
      updated: 0,
      skipped: true,
      skipReason: 'cron_stopped',
    });
    expect(
      applicationSettings.getLookAheadResetWindowDays
    ).not.toHaveBeenCalled();
  });

  it('returns paused_today and clears pause date when scheduled for tonight is paused', async () => {
    applicationSettings.getLookAheadResetCronSettings.mockResolvedValue({
      cronEnabled: true,
      pausedForDate: '2026-04-17',
    });
    const mockTx = mockTxLock(true);
    databaseService.db.transaction.mockImplementation(
      (fn: (tx: unknown) => unknown) => Promise.resolve(fn(mockTx))
    );

    const referenceUtcMs = Date.UTC(2026, 3, 18, 6, 45, 0);
    const result = await service.runBatch({
      actorUserId: 999,
      trigger: 'schedule',
      referenceUtcMs,
    });

    expect(result).toEqual({
      updated: 0,
      skipped: true,
      skipReason: 'paused_today',
    });
    expect(
      applicationSettings.clearLookAheadResetPausedForDate
    ).toHaveBeenCalledWith(mockTx);
  });

  it('passes the transaction executor to getLookAheadResetWindowDays', async () => {
    const mockTx = mockTxLock(true);
    databaseService.db.transaction.mockImplementation(
      (fn: (tx: unknown) => unknown) => Promise.resolve(fn(mockTx))
    );

    await service.runBatch({
      actorUserId: 999,
      trigger: 'schedule',
    });

    expect(
      applicationSettings.getLookAheadResetWindowDays
    ).toHaveBeenCalledTimes(1);
    expect(
      applicationSettings.getLookAheadResetWindowDays
    ).toHaveBeenCalledWith(mockTx);
  });

  it('returns error when the transaction fails', async () => {
    const errorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    try {
      databaseService.db.transaction.mockRejectedValue(
        new Error('transaction failed')
      );

      const result = await service.runBatch({
        actorUserId: 999,
        trigger: 'schedule',
      });

      expect(result).toEqual({
        updated: 0,
        skipped: true,
        skipReason: 'error',
      });
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('uses a distinct two-argument pg_try_advisory_xact_lock', async () => {
    const mockTx = mockTxLock(true);
    databaseService.db.transaction.mockImplementation(
      (fn: (tx: unknown) => unknown) => Promise.resolve(fn(mockTx))
    );

    await service.runBatch({
      actorUserId: 999,
      trigger: 'schedule',
    });

    expect(mockTx.execute).toHaveBeenCalled();
    const [sqlArg] = mockTx.execute.mock.calls[0] as [
      { queryChunks?: unknown[] },
    ];
    const serialized = JSON.stringify(sqlArg.queryChunks ?? sqlArg);
    expect(serialized).toContain('pg_try_advisory_xact_lock');
    expect(serialized).toMatch(/7881904/);
  });

  it('pauses tonight inside the transaction when manual run requests it', async () => {
    const mockTx = mockTxLock(true, [{ id: 10, lookAheadStatus: 'new' }]);
    databaseService.db.transaction.mockImplementation(
      (fn: (tx: unknown) => unknown) => Promise.resolve(fn(mockTx))
    );

    const result = await service.runBatch({
      actorUserId: 42,
      trigger: 'manual',
      pauseScheduledTonight: true,
      manual: { scope: 'window', days: 7 },
    });

    expect(result).toEqual({
      updated: 1,
      skipped: false,
      scheduledRunPausedTonight: true,
    });
    expect(applicationSettings.getLookAheadResetCronMode).toHaveBeenCalledWith(
      mockTx
    );
    expect(applicationSettings.setLookAheadResetCronMode).toHaveBeenCalledWith(
      'paused_today',
      mockTx
    );
  });

  it('returns rollback skipReason in_flight when a batch is already running', async () => {
    let finish!: (value: unknown) => void;
    databaseService.db.transaction.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );

    const batch = service.runBatch({
      actorUserId: 999,
      trigger: 'schedule',
    });
    await Promise.resolve();

    const result = await service.rollbackLastClear(999);
    expect(result).toEqual({
      restored: 0,
      skipped: 0,
      rollbackAvailable: true,
      skippedRollback: true,
      skipReason: 'in_flight',
    });

    finish({ updated: 0, skipped: false });
    await batch;
  });

  it('returns rollback skipReason advisory_lock when lock is not acquired', async () => {
    const mockTx = mockTxLock(false);
    databaseService.db.transaction.mockImplementation(
      (fn: (tx: unknown) => unknown) => Promise.resolve(fn(mockTx))
    );

    const result = await service.rollbackLastClear(999);

    expect(result).toEqual({
      restored: 0,
      skipped: 0,
      rollbackAvailable: true,
      skippedRollback: true,
      skipReason: 'advisory_lock',
    });
  });

  it('restores snapshot entries and deletes the snapshot on rollback', async () => {
    const snapshot = {
      id: 1,
      entries: [
        { activityId: 10, lookAheadStatus: 'new' },
        { activityId: 11, lookAheadStatus: 'changed' },
      ],
    };
    const mockTx = {
      execute: vi
        .fn()
        .mockResolvedValueOnce([{ acquired: true }])
        .mockResolvedValue(undefined),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([snapshot]),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    };
    mockTx.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([snapshot]),
        }),
      }),
    });
    mockTx.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { id: 10, lookAheadStatus: 'none' },
          { id: 11, lookAheadStatus: 'none' },
        ]),
      }),
    });

    databaseService.db.transaction.mockImplementation(
      (fn: (tx: unknown) => unknown) => Promise.resolve(fn(mockTx))
    );

    const result = await service.rollbackLastClear(42);

    expect(result).toEqual({
      restored: 2,
      skipped: 0,
      rollbackAvailable: false,
    });
    expect(mockTx.execute).toHaveBeenCalledTimes(2);
    expect(
      activityHistoryService.recordLookAheadStatusChangeBatch
    ).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({
        actorUserId: 42,
        entries: [
          {
            activityId: 10,
            oldLookAheadStatus: 'none',
            newLookAheadStatus: 'new',
          },
          {
            activityId: 11,
            oldLookAheadStatus: 'none',
            newLookAheadStatus: 'changed',
          },
        ],
      })
    );
    expect(mockTx.delete).toHaveBeenCalled();
  });

  it('skips deleted activities during rollback', async () => {
    const snapshot = {
      id: 1,
      entries: [
        { activityId: 10, lookAheadStatus: 'new' },
        { activityId: 99, lookAheadStatus: 'changed' },
      ],
    };
    const mockTx = {
      execute: vi
        .fn()
        .mockResolvedValueOnce([{ acquired: true }])
        .mockResolvedValue(undefined),
      select: vi.fn(),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    };
    mockTx.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([snapshot]),
        }),
      }),
    });
    mockTx.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 10, lookAheadStatus: 'none' }]),
      }),
    });

    databaseService.db.transaction.mockImplementation(
      (fn: (tx: unknown) => unknown) => Promise.resolve(fn(mockTx))
    );

    const result = await service.rollbackLastClear(42);

    expect(result).toEqual({
      restored: 1,
      skipped: 1,
      rollbackAvailable: false,
    });
    expect(mockTx.execute).toHaveBeenCalledTimes(2);
  });
});
