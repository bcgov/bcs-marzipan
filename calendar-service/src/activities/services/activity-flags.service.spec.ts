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
   * Build a chainable Drizzle-like mock.
   *
   * mode='limit': terminal call is limit().
   * mode='where': terminal call is where().
   */
  const makeChain = (
    resolveValue: unknown,
    mode: 'limit' | 'where' = 'limit'
  ) => {
    const chain: Record<string, unknown> = {};
    const methods = [
      'from',
      'innerJoin',
      'leftJoin',
      'orderBy',
      'groupBy',
      'offset',
    ];
    for (const m of methods) {
      chain[m] = vi.fn().mockReturnValue(chain);
    }
    chain['where'] =
      mode === 'where'
        ? vi.fn().mockResolvedValue(resolveValue)
        : vi.fn().mockReturnValue(chain);
    chain['limit'] = vi.fn().mockResolvedValue(resolveValue);
    return chain;
  };

  /** Builds a mock db.insert() chain for syncFlags insert path. */
  const makeInsertChain = () => {
    const chain: Record<string, unknown> = {};
    chain['values'] = vi.fn().mockReturnValue(chain);
    chain['onConflictDoNothing'] = vi.fn().mockResolvedValue(undefined);
    return chain;
  };

  /** Builds a mock db.delete() chain that resolves where() to undefined. */
  const makeDeleteChain = () => {
    const chain: Record<string, unknown> = {};
    chain['where'] = vi.fn().mockResolvedValue(undefined);
    return chain;
  };

  /** Builds a mock db.update() chain that resolves where() to undefined. */
  const makeUpdateChain = () => {
    const chain: Record<string, unknown> = {};
    chain['set'] = vi.fn().mockReturnValue(chain);
    chain['where'] = vi.fn().mockResolvedValue(undefined);
    return chain;
  };

  let mockDb: {
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      transaction: vi.fn(),
    };

    // Set up transaction to delegate to the same insert/delete/update/select methods
    mockDb.transaction.mockImplementation((callback) => {
      return callback({
        select: mockDb.select,
        insert: mockDb.insert,
        delete: mockDb.delete,
        update: mockDb.update,
      });
    });

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
  // upsertFlag / syncFlags
  // ---------------------------------------------------------------------------
  describe('upsertFlag', () => {
    it('throws NotFoundException when activity does not exist', async () => {
      // select() is called multiple times; first call (activity lookup) returns []
      mockDb.select.mockReturnValue(makeChain([], 'limit'));

      await expect(service.upsertFlag(999, 1, 2, 3)).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws ForbiddenException when assignee is not a team member', async () => {
      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        // 1st call: activity exists
        if (callCount === 1) return makeChain([{ id: 1 }], 'limit');
        // 2nd call: membership check → not found
        return makeChain([], 'where');
      });

      await expect(service.upsertFlag(1, 1, 99, 3)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('records flag_assigned for a fresh assignment', async () => {
      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeChain([{ id: 1 }], 'limit'); // activity exists
        if (callCount === 2)
          return makeChain([{ userId: 2, name: 'Jane Smith' }], 'where'); // membership + name
        return makeChain([], 'where'); // no existing flags
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
            oldValue: null,
            newValue: 'Jane Smith',
          },
        ],
        undefined,
        expect.any(Object)
      );
    });

    it('records flag_assigned and flag_removed when replacing one assignee with another', async () => {
      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeChain([{ id: 1 }], 'limit');
        if (callCount === 2)
          return makeChain([{ userId: 2, name: 'Jane Smith' }], 'where');
        return makeChain([{ assigneeId: 4, name: 'Old Person' }], 'where');
      });
      mockDb.insert.mockReturnValue(makeInsertChain());
      mockDb.delete.mockReturnValue(makeDeleteChain());

      await service.upsertFlag(1, 1, 2, 3);

      expect(mockHistoryService.recordChange).toHaveBeenCalledWith(
        1,
        3,
        'flag_assigned',
        [
          {
            field: 'flag.assigneeName',
            oldValue: null,
            newValue: 'Jane Smith',
          },
        ],
        undefined,
        expect.any(Object)
      );
      expect(mockHistoryService.recordChange).toHaveBeenCalledWith(
        1,
        3,
        'flag_removed',
        [
          {
            field: 'flag.assigneeName',
            oldValue: 'Old Person',
            newValue: null,
          },
        ],
        undefined,
        expect.any(Object)
      );
    });
  });

  // ---------------------------------------------------------------------------
  // removeFlag
  // ---------------------------------------------------------------------------
  describe('removeFlag', () => {
    it('records flag_removed for each assignee removed', async () => {
      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1)
          return makeChain(
            [
              { assigneeId: 2, name: 'Jane Smith' },
              { assigneeId: 4, name: 'John Doe' },
            ],
            'where'
          );
        return makeChain([], 'where');
      });
      mockDb.delete.mockReturnValue(makeDeleteChain());

      await service.removeFlag(1, 1, 3);

      expect(mockHistoryService.recordChange).toHaveBeenCalledWith(
        1,
        3,
        'flag_removed',
        [{ field: 'flag.assigneeName', oldValue: 'Jane Smith', newValue: null }]
      );
      expect(mockHistoryService.recordChange).toHaveBeenCalledWith(
        1,
        3,
        'flag_removed',
        [{ field: 'flag.assigneeName', oldValue: 'John Doe', newValue: null }]
      );
    });

    it('is a no-op (no delete, no history) when no flag existed', async () => {
      mockDb.select.mockReturnValue(makeChain([], 'where'));

      await service.removeFlag(1, 1, 3);

      expect(mockDb.delete).not.toHaveBeenCalled();
      expect(mockHistoryService.recordChange).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // removeAssigneeFlag
  // ---------------------------------------------------------------------------
  describe('removeAssigneeFlag', () => {
    it('removes one assignee and writes history entry', async () => {
      mockDb.select.mockReturnValue(
        makeChain([{ name: 'Jane Smith' }], 'limit')
      );
      mockDb.delete.mockReturnValue(makeDeleteChain());

      await service.removeAssigneeFlag(1, 1, 2, 3);

      expect(mockHistoryService.recordChange).toHaveBeenCalledWith(
        1,
        3,
        'flag_removed',
        [{ field: 'flag.assigneeName', oldValue: 'Jane Smith', newValue: null }]
      );
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
          assigneeFlagColour: null,
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
          assigneeFlagColour: '#FF5733',
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
          assigneeFlagColour: null,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ];

      // fetchFlagsForActivities does:
      //   select().from().innerJoin(teams).innerJoin(users).leftJoin(userSettings).where()
      const terminalChain = { where: vi.fn().mockResolvedValue(rows) };
      const afterLeftJoin = {
        where: vi.fn().mockResolvedValue(rows),
        leftJoin: vi.fn().mockReturnValue(terminalChain),
      };
      const afterSecondInnerJoin = {
        where: vi.fn().mockResolvedValue(rows),
        leftJoin: vi.fn().mockReturnValue(terminalChain),
        innerJoin: vi.fn().mockReturnValue(afterLeftJoin),
      };
      const afterFirstInnerJoin = {
        where: vi.fn().mockResolvedValue(rows),
        innerJoin: vi.fn().mockReturnValue(afterSecondInnerJoin),
        leftJoin: vi.fn().mockReturnValue(terminalChain),
      };
      const chain = makeChain(rows);
      (chain['from'] as ReturnType<typeof vi.fn>).mockReturnValue(
        afterFirstInnerJoin
      );
      mockDb.select.mockReturnValue(chain);

      const result = await service.fetchFlagsForActivities([1, 2], [10, 20]);

      expect(result.get(1)).toHaveLength(2);
      expect(result.get(2)).toHaveLength(1);
      expect(result.get(3)).toBeUndefined();
      // Verify flag colour is mapped correctly
      const flags1 = result.get(1)!;
      expect(flags1.find((f) => f.assigneeId === 4)?.assigneeFlagColour).toBe(
        '#FF5733'
      );
      expect(
        flags1.find((f) => f.assigneeId === 2)?.assigneeFlagColour
      ).toBeNull();
    });
  });
});
