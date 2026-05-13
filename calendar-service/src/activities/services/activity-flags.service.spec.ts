import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseService } from '../../database/database.service';
import { ActivityFlagsService } from './activity-flags.service';
import { ActivityHistoryService } from './activity-history.service';

describe('ActivityFlagsService', () => {
  let service: ActivityFlagsService;

  const mockHistoryService = {
    recordChange: vi.fn().mockResolvedValue(undefined),
  };

  /**
   * Build a chainable Drizzle-like mock where each method returns `this`
   * except `limit`, which resolves to `resolveValue`.
   */
  const makeChain = (resolveValue: unknown) => {
    const chain: Record<string, unknown> = {};
    const methods = [
      'from',
      'where',
      'innerJoin',
      'leftJoin',
      'orderBy',
      'groupBy',
      'offset',
    ];
    for (const m of methods) {
      chain[m] = vi.fn().mockReturnValue(chain);
    }
    chain['limit'] = vi.fn().mockResolvedValue(resolveValue);
    return chain;
  };

  /** Builds a mock db.insert() chain that resolves onConflictDoUpdate to undefined. */
  const makeInsertChain = () => {
    const chain: Record<string, unknown> = {};
    chain['values'] = vi.fn().mockReturnValue(chain);
    chain['onConflictDoUpdate'] = vi.fn().mockResolvedValue(undefined);
    return chain;
  };

  /** Builds a mock db.delete() chain that resolves where() to undefined. */
  const makeDeleteChain = () => {
    const chain: Record<string, unknown> = {};
    chain['where'] = vi.fn().mockResolvedValue(undefined);
    return chain;
  };

  let mockDb: {
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      delete: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityFlagsService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: ActivityHistoryService, useValue: mockHistoryService },
      ],
    }).compile();

    service = module.get<ActivityFlagsService>(ActivityFlagsService);
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // upsertFlag
  // ---------------------------------------------------------------------------
  describe('upsertFlag', () => {
    it('throws NotFoundException when activity does not exist', async () => {
      // select() is called multiple times; first call (activity lookup) returns []
      mockDb.select.mockReturnValue(makeChain([]));

      await expect(service.upsertFlag(999, 1, 2, 3)).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws ForbiddenException when assignee is not a team member', async () => {
      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        // 1st call: activity exists
        if (callCount === 1) return makeChain([{ id: 1 }]);
        // 2nd call: membership check → not found
        return makeChain([]);
      });

      await expect(service.upsertFlag(1, 1, 99, 3)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('records flag_assigned with names for a fresh assignment', async () => {
      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeChain([{ id: 1 }]); // activity exists
        if (callCount === 2) return makeChain([{ userId: 2 }]); // membership ok
        if (callCount === 3) return makeChain([]); // no existing flag
        return makeChain([{ name: 'Jane Smith' }]); // assignee name
      });
      mockDb.insert.mockReturnValue(makeInsertChain());

      await service.upsertFlag(1, 1, 2, 3);

      expect(mockHistoryService.recordChange).toHaveBeenCalledWith(
        1,
        3,
        'flag_assigned',
        [{ field: 'flag.assigneeName', oldValue: null, newValue: 'Jane Smith' }]
      );
    });

    it('records flag_assigned with previous name for a reassignment', async () => {
      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeChain([{ id: 1 }]);
        if (callCount === 2) return makeChain([{ userId: 2 }]);
        if (callCount === 3) return makeChain([{ existingName: 'Old Person' }]); // existing flag
        return makeChain([{ name: 'Jane Smith' }]); // new assignee name
      });
      mockDb.insert.mockReturnValue(makeInsertChain());

      await service.upsertFlag(1, 1, 2, 3);

      expect(mockHistoryService.recordChange).toHaveBeenCalledWith(
        1,
        3,
        'flag_assigned',
        [
          {
            field: 'flag.assigneeName',
            oldValue: 'Old Person',
            newValue: 'Jane Smith',
          },
        ]
      );
    });
  });

  // ---------------------------------------------------------------------------
  // removeFlag
  // ---------------------------------------------------------------------------
  describe('removeFlag', () => {
    it('records flag_removed with the assignee name', async () => {
      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        // 1st call: existing flag with assignee name
        if (callCount === 1) return makeChain([{ name: 'Jane Smith' }]);
        return makeChain([]);
      });
      mockDb.delete.mockReturnValue(makeDeleteChain());

      await service.removeFlag(1, 1, 3);

      expect(mockHistoryService.recordChange).toHaveBeenCalledWith(
        1,
        3,
        'flag_removed',
        [{ field: 'flag.assigneeName', oldValue: 'Jane Smith', newValue: null }]
      );
    });

    it('is a no-op (no delete, no history) when no flag existed', async () => {
      mockDb.select.mockReturnValue(makeChain([]));

      await service.removeFlag(1, 1, 3);

      expect(mockDb.delete).not.toHaveBeenCalled();
      expect(mockHistoryService.recordChange).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // fetchFlagsForActivities
  // ---------------------------------------------------------------------------
  describe('fetchFlagsForActivities', () => {
    it('returns an empty map when activityIds is empty', async () => {
      const result = await service.fetchFlagsForActivities([], [1]);
      expect(result).toEqual(new Map());
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('returns an empty map when teamIds is empty', async () => {
      const result = await service.fetchFlagsForActivities([1], []);
      expect(result).toEqual(new Map());
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('groups flag rows by activityId', async () => {
      const rows = [
        {
          activityId: 1,
          teamId: 10,
          teamName: 'Team A',
          assigneeId: 2,
          assigneeName: 'Jane Smith',
          assignedById: 3,
          note: null,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
        {
          activityId: 1,
          teamId: 20,
          teamName: 'Team B',
          assigneeId: 4,
          assigneeName: 'John Doe',
          assignedById: 3,
          note: null,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
        {
          activityId: 2,
          teamId: 10,
          teamName: 'Team A',
          assigneeId: 2,
          assigneeName: 'Jane Smith',
          assignedById: 3,
          note: null,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ];

      // fetchFlagsForActivities does: select().from().innerJoin().innerJoin().where()
      const chain = makeChain(rows);
      // where() on the innerJoin chain resolves directly (no further limit call)
      const innerJoinChain: Record<string, unknown> = {
        ...chain,
        where: vi.fn().mockResolvedValue(rows),
      };
      (chain['innerJoin'] as ReturnType<typeof vi.fn>).mockReturnValue(
        innerJoinChain
      );
      (innerJoinChain['innerJoin'] as ReturnType<typeof vi.fn>) = vi
        .fn()
        .mockReturnValue({
          where: vi.fn().mockResolvedValue(rows),
        });
      mockDb.select.mockReturnValue(chain);

      const result = await service.fetchFlagsForActivities([1, 2], [10, 20]);

      expect(result.get(1)).toHaveLength(2);
      expect(result.get(2)).toHaveLength(1);
      expect(result.get(3)).toBeUndefined();
    });
  });
});
