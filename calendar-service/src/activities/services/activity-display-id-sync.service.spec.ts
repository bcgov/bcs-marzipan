import { Test, TestingModule } from '@nestjs/testing';

import {
  buildActivityDisplayId,
  normalizeTeamAbbreviationForActivityDisplayId,
} from '@corpcal/shared';

import { DatabaseService } from '../../database/database.service';
import { ActivityDisplayIdSyncService } from './activity-display-id-sync.service';
import { ActivityHistoryService } from './activity-history.service';
import { ActivityUtilsService } from './activity-utils.service';

type CandidateRow = {
  id: number;
  displayId: string | null;
  leadMinistryId: number | null;
  teamAbbreviation: string | null;
  ministryAbbreviation: string | null;
};

/**
 * Build a minimal `tx` stub that returns the given candidate rows on the second
 * `.select(...)` invocation. The first `.select(...)` builds the excluded-status
 * id subquery and only its chain needs to be non-throwing.
 */
const buildTxStub = (candidates: CandidateRow[]) => {
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
  const update = vi.fn().mockReturnValue({ set: updateSet });

  const firstSelectChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  };

  const candidateSelectChain = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(candidates),
  };

  const select = vi
    .fn()
    .mockReturnValueOnce(firstSelectChain)
    .mockReturnValueOnce(candidateSelectChain);

  return {
    tx: { select, update },
    updateWhere,
    updateSet,
    update,
  };
};

describe('ActivityDisplayIdSyncService', () => {
  let service: ActivityDisplayIdSyncService;
  let historyService: { recordDisplayIdChangeBatch: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    historyService = {
      recordDisplayIdChangeBatch: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityDisplayIdSyncService,
        ActivityUtilsService,
        {
          provide: DatabaseService,
          useValue: { db: {} },
        },
        {
          provide: ActivityHistoryService,
          useValue: historyService,
        },
      ],
    }).compile();

    service = module.get(ActivityDisplayIdSyncService);
  });

  describe('refreshAfterMinistryAbbreviationChange', () => {
    it('updates activities whose computed displayId differs and records history', async () => {
      const candidates: CandidateRow[] = [
        {
          id: 100,
          displayId: 'OLD-000100',
          leadMinistryId: 5,
          ministryAbbreviation: 'NEW',
          teamAbbreviation: 'TM',
        },
      ];
      const stub = buildTxStub(candidates);

      const result = await service.refreshAfterMinistryAbbreviationChange(
        stub.tx as never,
        5,
        42
      );

      expect(result.updatedCount).toBe(1);
      expect(stub.update).toHaveBeenCalledTimes(1);
      expect(stub.updateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          displayId: 'NEW-000100',
          lastUpdatedBy: 42,
        })
      );
      expect(historyService.recordDisplayIdChangeBatch).toHaveBeenCalledTimes(
        1
      );
      const args = historyService.recordDisplayIdChangeBatch.mock.calls[0][1];
      expect(args.actorUserId).toBe(42);
      expect(args.entries).toEqual([
        {
          activityId: 100,
          oldDisplayId: 'OLD-000100',
          newDisplayId: 'NEW-000100',
        },
      ]);
      expect(args.notes).toMatch(/ministry abbreviation/);
    });

    it('skips activities whose computed displayId is unchanged', async () => {
      const candidates: CandidateRow[] = [
        {
          id: 100,
          displayId: 'MR-000100',
          leadMinistryId: 5,
          ministryAbbreviation: 'MR',
          teamAbbreviation: 'TM',
        },
      ];
      const stub = buildTxStub(candidates);

      const result = await service.refreshAfterMinistryAbbreviationChange(
        stub.tx as never,
        5,
        42
      );

      expect(result.updatedCount).toBe(0);
      expect(stub.update).not.toHaveBeenCalled();
      expect(historyService.recordDisplayIdChangeBatch).not.toHaveBeenCalled();
    });

    it('is a no-op when there are no candidate activities', async () => {
      const stub = buildTxStub([]);

      const result = await service.refreshAfterMinistryAbbreviationChange(
        stub.tx as never,
        99,
        42
      );

      expect(result.updatedCount).toBe(0);
      expect(stub.update).not.toHaveBeenCalled();
      expect(historyService.recordDisplayIdChangeBatch).not.toHaveBeenCalled();
    });

    it('falls back to team abbreviation when ministry abbreviation is empty', async () => {
      const candidates: CandidateRow[] = [
        {
          id: 7,
          displayId: 'OLD-000007',
          leadMinistryId: 5,
          ministryAbbreviation: '',
          teamAbbreviation: 'TM',
        },
      ];
      const stub = buildTxStub(candidates);

      await service.refreshAfterMinistryAbbreviationChange(
        stub.tx as never,
        5,
        1
      );

      expect(stub.updateSet).toHaveBeenCalledWith(
        expect.objectContaining({ displayId: 'TM-000007' })
      );
    });
  });

  describe('refreshAfterTeamAbbreviationChange', () => {
    it('updates only activities whose prefix is team-driven', async () => {
      const candidates: CandidateRow[] = [
        {
          id: 1,
          displayId: 'OLD-000001',
          leadMinistryId: null,
          ministryAbbreviation: null,
          teamAbbreviation: 'NEW',
        },
        {
          id: 2,
          displayId: 'OLD-000002',
          leadMinistryId: 9,
          ministryAbbreviation: '',
          teamAbbreviation: 'NEW',
        },
      ];
      const stub = buildTxStub(candidates);

      const result = await service.refreshAfterTeamAbbreviationChange(
        stub.tx as never,
        3,
        1
      );

      expect(result.updatedCount).toBe(2);
      expect(stub.update).toHaveBeenCalledTimes(2);
      expect(historyService.recordDisplayIdChangeBatch).toHaveBeenCalledTimes(
        1
      );
      const args = historyService.recordDisplayIdChangeBatch.mock.calls[0][1];
      expect(args.entries).toEqual([
        {
          activityId: 1,
          oldDisplayId: 'OLD-000001',
          newDisplayId: 'NEW-000001',
        },
        {
          activityId: 2,
          oldDisplayId: 'OLD-000002',
          newDisplayId: 'NEW-000002',
        },
      ]);
      expect(args.notes).toMatch(/team abbreviation/);
    });

    it('uses team abbreviation fallback when the team abbreviation normalizes to empty', async () => {
      const candidates: CandidateRow[] = [
        {
          id: 12,
          displayId: 'OLD-000012',
          leadMinistryId: null,
          ministryAbbreviation: null,
          teamAbbreviation: '   ',
        },
      ];
      const stub = buildTxStub(candidates);

      await service.refreshAfterTeamAbbreviationChange(stub.tx as never, 3, 1);

      expect(stub.updateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          displayId: buildActivityDisplayId(
            normalizeTeamAbbreviationForActivityDisplayId('   '),
            12
          ),
        })
      );
    });
  });
});
