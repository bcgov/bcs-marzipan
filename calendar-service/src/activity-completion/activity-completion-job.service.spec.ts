import { Test, TestingModule } from '@nestjs/testing';

import { ActivityHistoryService } from '../activities/services/activity-history.service';
import { DatabaseService } from '../database/database.service';
import { ApplicationSettingsService } from '../locks/application-settings.service';
import { ActivityCompletionJobService } from './activity-completion-job.service';

describe('ActivityCompletionJobService', () => {
  let service: ActivityCompletionJobService;
  let databaseService: {
    db: { transaction: ReturnType<typeof vi.fn> };
  };
  let applicationSettings: { getCompletionSettings: ReturnType<typeof vi.fn> };

  function mockTxForEligibleQueryEmpty(acquired: boolean) {
    let selectCall = 0;
    return {
      execute: vi.fn().mockResolvedValue([{ acquired }]),
      select: vi.fn().mockImplementation(() => {
        const n = selectCall++;
        if (n < 4) {
          return {
            from: () => ({
              where: () => ({
                limit: () => Promise.resolve([{ id: n + 1 }]),
              }),
            }),
          };
        }
        return {
          from: () => ({
            where: () => Promise.resolve([]),
          }),
        };
      }),
    };
  }

  beforeEach(async () => {
    databaseService = {
      db: {
        transaction: vi.fn(),
      },
    };
    applicationSettings = {
      getCompletionSettings: vi.fn().mockResolvedValue({
        schedule: 'daily',
        bufferMinutes: 0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityCompletionJobService,
        { provide: DatabaseService, useValue: databaseService },
        {
          provide: ApplicationSettingsService,
          useValue: applicationSettings,
        },
        {
          provide: ActivityHistoryService,
          useValue: { recordChange: vi.fn() },
        },
      ],
    }).compile();

    service = module.get(ActivityCompletionJobService);
  });

  it('returns in_flight when a batch is already running on this pod', async () => {
    let finish!: (value: unknown) => void;
    databaseService.db.transaction.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );

    const first = service.runBatch();
    await Promise.resolve();

    const second = await service.runBatch();
    expect(second).toEqual({
      updated: 0,
      skipped: true,
      skipReason: 'in_flight',
    });

    finish({ updated: 0, skipped: false });
    await first;
  });

  it('returns advisory_lock and does not read settings when the advisory lock is not acquired', async () => {
    const mockTx = mockTxForEligibleQueryEmpty(false);
    databaseService.db.transaction.mockImplementation(
      (fn: (tx: unknown) => unknown) => Promise.resolve(fn(mockTx))
    );

    const result = await service.runBatch();

    expect(result).toEqual({
      updated: 0,
      skipped: true,
      skipReason: 'advisory_lock',
    });
    expect(applicationSettings.getCompletionSettings).not.toHaveBeenCalled();
  });

  it('passes the transaction executor to getCompletionSettings (avoids pool self-deadlock)', async () => {
    const mockTx = mockTxForEligibleQueryEmpty(true);
    databaseService.db.transaction.mockImplementation(
      (fn: (tx: unknown) => unknown) => Promise.resolve(fn(mockTx))
    );

    await service.runBatch();

    expect(applicationSettings.getCompletionSettings).toHaveBeenCalledTimes(1);
    expect(applicationSettings.getCompletionSettings).toHaveBeenCalledWith(
      mockTx
    );
  });

  it('returns error when the transaction fails', async () => {
    databaseService.db.transaction.mockRejectedValue(
      new Error('transaction failed')
    );

    const result = await service.runBatch();

    expect(result).toEqual({
      updated: 0,
      skipped: true,
      skipReason: 'error',
    });
  });

  it('uses two-argument pg_try_advisory_xact_lock (separate namespace from single-arg edit locks)', async () => {
    const mockTx = mockTxForEligibleQueryEmpty(true);
    databaseService.db.transaction.mockImplementation(
      (fn: (tx: unknown) => unknown) => Promise.resolve(fn(mockTx))
    );

    await service.runBatch();

    expect(mockTx.execute).toHaveBeenCalled();
    const [sqlArg] = mockTx.execute.mock.calls[0] as [
      { queryChunks?: unknown[] },
    ];
    const serialized = JSON.stringify(sqlArg.queryChunks ?? sqlArg);
    expect(serialized).toContain('pg_try_advisory_xact_lock');
    expect(serialized).toMatch(/::integer.*::integer/s);
  });
});
