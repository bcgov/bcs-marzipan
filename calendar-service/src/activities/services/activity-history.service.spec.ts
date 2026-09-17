import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseService } from '../../database/database.service';
import { ActivityHistoryService } from './activity-history.service';

type PagedHistoryRow = {
  id: number;
  activityId: number;
  userId: number;
  actionType: string;
  changes: unknown;
  notes: string | null;
  timestamp: Date | string;
};

function createCountQueryChain(count: number) {
  const result = [{ count }];
  const terminal = {
    then: (
      onFulfilled: (value: typeof result) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  };
  const chain: {
    leftJoin: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
  } = {
    leftJoin: vi.fn(),
    where: vi.fn(),
  };
  chain.leftJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(terminal);
  return chain;
}

function createThenableQueryChain<T>(value: T) {
  const chain: {
    leftJoin: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    offset: ReturnType<typeof vi.fn>;
    then: PromiseLike<T>['then'];
  } = {} as {
    leftJoin: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    offset: ReturnType<typeof vi.fn>;
    then: PromiseLike<T>['then'];
  };

  for (const method of [
    'leftJoin',
    'where',
    'orderBy',
    'limit',
    'offset',
  ] as const) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  chain.then = (onFulfilled, onRejected) =>
    Promise.resolve(value).then(onFulfilled, onRejected);

  return chain;
}

function installPagedHistoryDbMock(
  mockDb: {
    select: ReturnType<typeof vi.fn>;
  },
  config: {
    rows: PagedHistoryRow[];
    totalCount?: number;
    users?: Array<{
      id: number;
      adDisplayName: string | null;
      adUsername: string | null;
    }>;
  }
) {
  let selectCall = 0;

  mockDb.select = vi.fn().mockImplementation(() => {
    selectCall += 1;

    if (selectCall === 1) {
      const mainChain = createThenableQueryChain(config.rows);
      return {
        from: vi.fn().mockReturnValue(mainChain),
      };
    }

    if (selectCall === 2) {
      const countChain = createCountQueryChain(
        config.totalCount ?? config.rows.length
      );
      return {
        from: vi.fn().mockReturnValue(countChain),
      };
    }

    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(config.users ?? []),
      }),
    };
  });
}

describe('ActivityHistoryService', () => {
  let service: ActivityHistoryService;
  let mockDb: {
    select: ReturnType<typeof vi.fn>;
    from: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    insert?: ReturnType<typeof vi.fn>;
  };

  const _createMockQueryChain = (finalValue: unknown) => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(finalValue),
    };
    return chain;
  };

  beforeEach(async () => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityHistoryService,
        {
          provide: DatabaseService,
          useValue: { db: mockDb },
        },
      ],
    }).compile();

    service = module.get<ActivityHistoryService>(ActivityHistoryService);
  });

  describe('recordChange', () => {
    const createRecordChangeSelectMock = () => {
      let selectCount = 0;
      return vi.fn().mockImplementation(() => {
        selectCount += 1;
        const callIndex = selectCount;
        const limit = vi
          .fn()
          .mockResolvedValue(
            callIndex === 1
              ? [{ title: 'Activity', displayId: 'A-001' }]
              : callIndex === 2
                ? [{ displayName: 'Alice', username: 'alice' }]
                : []
          );
        const where = vi.fn().mockImplementation(() => {
          if (callIndex <= 2) {
            return { limit };
          }
          return Promise.resolve([]);
        });
        return {
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({ where }),
            where,
          }),
        };
      });
    };

    it('stores normalized changes when field changes are present', async () => {
      const returning = vi.fn().mockResolvedValue([{ id: 99 }]);
      const values = vi.fn().mockReturnValue({ returning });
      const insert = vi.fn().mockReturnValue({ values });

      mockDb.select = createRecordChangeSelectMock();
      mockDb.insert = insert;

      await service.recordChange(
        1,
        2,
        'updated',
        [
          { field: 'categories', oldValue: [1], newValue: [2] },
          { field: 'title', oldValue: 'Old', newValue: 'New' },
        ],
        'Batch note'
      );

      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: [
            {
              field: 'categoryIds',
              oldValue: [1],
              newValue: [2],
            },
            {
              field: 'title',
              oldValue: 'Old',
              newValue: 'New',
            },
          ],
        })
      );
    });

    it('stores null changes for note-only entries', async () => {
      const returning = vi.fn().mockResolvedValue([{ id: 100 }]);
      const values = vi.fn().mockReturnValue({ returning });
      const insert = vi.fn().mockReturnValue({ values });

      mockDb.select = createRecordChangeSelectMock();
      mockDb.insert = insert;

      await service.recordChange(1, 2, 'note_added', undefined, 'Note only');

      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: null,
        })
      );
    });
  });

  describe('getActivityHistory', () => {
    it('redacts scoped fields for restricted viewers', async () => {
      const historyEntries = [
        {
          id: 1,
          activityId: 10,
          userId: 2,
          actionType: 'updated',
          changes: [
            { field: 'title', oldValue: 'A', newValue: 'B' },
            { field: 'notes', oldValue: 'secret', newValue: 'updated' },
          ],
          notes: null,
          timestamp: new Date('2026-01-01T12:00:00.000Z'),
        },
      ];

      let selectCount = 0;
      mockDb.select = vi.fn().mockImplementation(() => {
        selectCount += 1;
        if (selectCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue(historyEntries),
              }),
            }),
          };
        }

        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              {
                id: 2,
                adDisplayName: 'Alice',
                adUsername: 'alice',
              },
            ]),
          }),
        };
      });

      const result = await service.getActivityHistory(10, {
        permissions: [],
        roleName: 'Viewer',
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.changes).toEqual([
        { field: 'title', oldValue: 'A', newValue: 'B' },
      ]);
    });
  });

  describe('getPreviousStatusIdBeforeDelete', () => {
    it('should return oldValue from most recent delete_requested entry when changes contain activityStatusId', async () => {
      const changes = [
        {
          field: 'activityStatusId',
          oldValue: 2,
          newValue: 5,
        },
      ];
      mockDb.limit.mockResolvedValue([{ changes }]);

      const result = await service.getPreviousStatusIdBeforeDelete(1);

      expect(result).toBe(2);
    });

    it('should return oldValue from most recent soft_deleted entry', async () => {
      const changes = [
        {
          field: 'activityStatusId',
          oldValue: 3,
          newValue: 4,
        },
      ];
      mockDb.limit.mockResolvedValue([{ changes }]);

      const result = await service.getPreviousStatusIdBeforeDelete(10);

      expect(result).toBe(3);
    });

    it('should return null when no matching history entry exists', async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await service.getPreviousStatusIdBeforeDelete(1);

      expect(result).toBeNull();
    });

    it('should return null when entry exists but changes is null', async () => {
      mockDb.limit.mockResolvedValue([{ changes: null }]);

      const result = await service.getPreviousStatusIdBeforeDelete(1);

      expect(result).toBeNull();
    });

    it('should return null when entry exists but changes is not an array', async () => {
      mockDb.limit.mockResolvedValue([{ changes: {} }]);

      const result = await service.getPreviousStatusIdBeforeDelete(1);

      expect(result).toBeNull();
    });

    it('should return null when changes has no activityStatusId field', async () => {
      mockDb.limit.mockResolvedValue([
        {
          changes: [{ field: 'title', oldValue: 'Old', newValue: 'New' }],
        },
      ]);

      const result = await service.getPreviousStatusIdBeforeDelete(1);

      expect(result).toBeNull();
    });

    it('should return null when activityStatusId oldValue is not a number', async () => {
      mockDb.limit.mockResolvedValue([
        {
          changes: [
            {
              field: 'activityStatusId',
              oldValue: 'invalid',
              newValue: 5,
            },
          ],
        },
      ]);

      const result = await service.getPreviousStatusIdBeforeDelete(1);

      expect(result).toBeNull();
    });

    it('should return null when activityStatusId oldValue is null', async () => {
      mockDb.limit.mockResolvedValue([
        {
          changes: [
            {
              field: 'activityStatusId',
              oldValue: null,
              newValue: 5,
            },
          ],
        },
      ]);

      const result = await service.getPreviousStatusIdBeforeDelete(1);

      expect(result).toBeNull();
    });
  });

  describe('resolveCommsContacts', () => {
    // These methods accept `db` as a parameter, so we supply a focused mock where
    // `.where()` is the terminal step (resolves directly rather than chaining to .limit).
    let terminalDb: {
      select: ReturnType<typeof vi.fn>;
      from: ReturnType<typeof vi.fn>;
      where: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      terminalDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };
    });

    it('should return empty array when contacts list is empty', async () => {
      const result = await service.resolveCommsContacts(
        terminalDb as never,
        []
      );
      expect(result).toEqual([]);
      expect(terminalDb.select).not.toHaveBeenCalled();
    });

    it('should resolve userId to adDisplayName', async () => {
      terminalDb.where.mockResolvedValueOnce([
        { id: 1, adDisplayName: 'Alice Smith', adUsername: 'asmith' },
      ]);
      const result = await service.resolveCommsContacts(terminalDb as never, [
        { userId: 1, isLead: true },
      ]);
      expect(result).toEqual([{ userName: 'Alice Smith', isLead: true }]);
    });

    it('should fall back to adUsername when adDisplayName is null', async () => {
      terminalDb.where.mockResolvedValueOnce([
        { id: 2, adDisplayName: null, adUsername: 'bjones' },
      ]);
      const result = await service.resolveCommsContacts(terminalDb as never, [
        { userId: 2, isLead: false },
      ]);
      expect(result).toEqual([{ userName: 'bjones', isLead: false }]);
    });

    it('should fall back to "User {id}" when both display name fields are null', async () => {
      terminalDb.where.mockResolvedValueOnce([
        { id: 3, adDisplayName: null, adUsername: null },
      ]);
      const result = await service.resolveCommsContacts(terminalDb as never, [
        { userId: 3, isLead: false },
      ]);
      expect(result).toEqual([{ userName: 'User 3', isLead: false }]);
    });

    it('should fall back to "User {id}" when user is not found in the DB', async () => {
      terminalDb.where.mockResolvedValueOnce([]);
      const result = await service.resolveCommsContacts(terminalDb as never, [
        { userId: 99, isLead: false },
      ]);
      expect(result).toEqual([{ userName: 'User 99', isLead: false }]);
    });

    it('should preserve isLead for each contact and handle multiple contacts', async () => {
      terminalDb.where.mockResolvedValueOnce([
        { id: 1, adDisplayName: 'Alice', adUsername: 'alice' },
        { id: 2, adDisplayName: 'Bob', adUsername: 'bob' },
      ]);
      const result = await service.resolveCommsContacts(terminalDb as never, [
        { userId: 1, isLead: true },
        { userId: 2, isLead: false },
      ]);
      expect(result).toEqual([
        { userName: 'Alice', isLead: true },
        { userName: 'Bob', isLead: false },
      ]);
    });

    it('should deduplicate userIds when querying but preserve all contact entries', async () => {
      terminalDb.where.mockResolvedValueOnce([
        { id: 1, adDisplayName: 'Alice', adUsername: 'alice' },
      ]);
      const result = await service.resolveCommsContacts(terminalDb as never, [
        { userId: 1, isLead: true },
        { userId: 1, isLead: false },
      ]);
      expect(result).toEqual([
        { userName: 'Alice', isLead: true },
        { userName: 'Alice', isLead: false },
      ]);
      // Only one DB query despite two contacts with same userId
      expect(terminalDb.where).toHaveBeenCalledTimes(1);
    });
  });

  describe('buildEntityResolutionMaps', () => {
    let terminalDb: {
      select: ReturnType<typeof vi.fn>;
      from: ReturnType<typeof vi.fn>;
      where: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      terminalDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };
    });

    it('should return empty map when no FK fields are present in either object', async () => {
      const result = await service.buildEntityResolutionMaps(
        terminalDb as never,
        { title: 'Old' },
        { title: 'New' }
      );
      expect(result.size).toBe(0);
      expect(terminalDb.select).not.toHaveBeenCalled();
    });

    it('should resolve lastUpdatedBy and createdBy to the same user map', async () => {
      terminalDb.where.mockResolvedValueOnce([
        { id: 5, adDisplayName: 'Alice Smith', adUsername: 'asmith' },
      ]);
      const result = await service.buildEntityResolutionMaps(
        terminalDb as never,
        { lastUpdatedBy: 5, createdBy: 5 },
        { lastUpdatedBy: 5, createdBy: 5 }
      );
      expect(result.get('lastUpdatedBy')?.get(5)).toBe('Alice Smith');
      expect(result.get('createdBy')?.get(5)).toBe('Alice Smith');
      // Both fields share one DB query
      expect(terminalDb.where).toHaveBeenCalledTimes(1);
    });

    it('should resolve leadTeamId to team display name', async () => {
      terminalDb.where.mockResolvedValueOnce([
        { id: 10, displayName: 'Team Alpha', name: 'alpha' },
      ]);
      const result = await service.buildEntityResolutionMaps(
        terminalDb as never,
        { leadTeamId: 10 },
        { leadTeamId: 20 }
      );
      expect(result.get('leadTeamId')?.get(10)).toBe('Team Alpha');
    });

    it('should resolve leadMinistryId to ministry display name', async () => {
      terminalDb.where.mockResolvedValueOnce([
        { id: 3, displayName: 'Ministry of Finance' },
      ]);
      const result = await service.buildEntityResolutionMaps(
        terminalDb as never,
        { leadMinistryId: 3 },
        { leadMinistryId: 4 }
      );
      expect(result.get('leadMinistryId')?.get(3)).toBe('Ministry of Finance');
    });

    it('should resolve leadOrgId to organization display name', async () => {
      terminalDb.where.mockResolvedValueOnce([
        { id: 7, displayName: 'Acme Corp' },
      ]);
      const result = await service.buildEntityResolutionMaps(
        terminalDb as never,
        { leadOrgId: 7 },
        { leadOrgId: 8 }
      );
      expect(result.get('leadOrgId')?.get(7)).toBe('Acme Corp');
    });

    it('should make separate DB queries for each FK field type present', async () => {
      terminalDb.where
        .mockResolvedValueOnce([
          { id: 1, adDisplayName: 'Alice', adUsername: 'alice' },
        ])
        .mockResolvedValueOnce([
          { id: 10, displayName: 'Team Alpha', name: 'alpha' },
        ]);
      const result = await service.buildEntityResolutionMaps(
        terminalDb as never,
        { lastUpdatedBy: 1, leadTeamId: 10 },
        { lastUpdatedBy: 1, leadTeamId: 10 }
      );
      expect(result.get('lastUpdatedBy')?.get(1)).toBe('Alice');
      expect(result.get('leadTeamId')?.get(10)).toBe('Team Alpha');
      expect(terminalDb.where).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateChangeList', () => {
    it('should return empty array when objects are identical', () => {
      const obj = { title: 'Same', isIssue: false };
      expect(service.generateChangeList(obj, { ...obj })).toEqual([]);
    });

    it('should detect a changed scalar field', () => {
      const changes = service.generateChangeList(
        { title: 'Old title' },
        { title: 'New title' }
      );
      expect(changes).toEqual([
        { field: 'title', oldValue: 'Old title', newValue: 'New title' },
      ]);
    });

    it('should skip audit and non-tracked history fields', () => {
      const changes = service.generateChangeList(
        {
          id: 1,
          createdDateTime: 'a',
          lastUpdatedDateTime: 'b',
          rowVersion: 1,
          displayId: 'X-001',
          lastUpdatedBy: 1,
          createdBy: 2,
        },
        {
          id: 2,
          createdDateTime: 'c',
          lastUpdatedDateTime: 'd',
          rowVersion: 2,
          displayId: 'X-002',
          lastUpdatedBy: 3,
          createdBy: 4,
        }
      );
      expect(changes).toEqual([]);
    });

    it('should set oldValue to null for fields only present in newActivity', () => {
      const changes = service.generateChangeList({}, { leadTeamId: 5 });
      expect(changes).toEqual([
        { field: 'leadTeamId', oldValue: null, newValue: 5 },
      ]);
    });

    it('should set newValue to null for fields only present in oldActivity', () => {
      const changes = service.generateChangeList(
        { summary: 'Old summary' },
        {}
      );
      expect(changes).toEqual([
        { field: 'summary', oldValue: 'Old summary', newValue: null },
      ]);
    });

    it('should substitute resolved display name from resolutions map', () => {
      const resolutions = new Map<string, Map<number, string>>([
        ['leadTeamId', new Map([[10, 'Team Alpha']])],
      ]);
      const changes = service.generateChangeList(
        { leadTeamId: 5 },
        { leadTeamId: 10 },
        resolutions
      );
      expect(changes).toEqual([
        { field: 'leadTeamId', oldValue: 5, newValue: 'Team Alpha' },
      ]);
    });

    it('should keep raw numeric value when resolution map has no entry for that id', () => {
      const resolutions = new Map<string, Map<number, string>>([
        ['leadTeamId', new Map([[99, 'Other Team']])],
      ]);
      const changes = service.generateChangeList(
        { leadTeamId: 5 },
        { leadTeamId: 10 },
        resolutions
      );
      expect(changes).toEqual([
        { field: 'leadTeamId', oldValue: 5, newValue: 10 },
      ]);
    });

    it('should not apply resolution to non-numeric values', () => {
      const resolutions = new Map<string, Map<number, string>>([
        ['title', new Map()],
      ]);
      const changes = service.generateChangeList(
        { title: 'Old' },
        { title: 'New' },
        resolutions
      );
      expect(changes).toEqual([
        { field: 'title', oldValue: 'Old', newValue: 'New' },
      ]);
    });
  });

  describe('getActivityHistoryForActivityIdsPaged', () => {
    const sampleRow = (
      overrides: Partial<PagedHistoryRow> = {}
    ): PagedHistoryRow => ({
      id: 1,
      activityId: 10,
      userId: 2,
      actionType: 'updated',
      changes: [{ field: 'title', oldValue: 'A', newValue: 'B' }],
      notes: null,
      timestamp: new Date('2026-03-20T20:00:00.000Z'),
      ...overrides,
    });

    it('returns empty results without querying when activityIds is empty', async () => {
      const result = await service.getActivityHistoryForActivityIdsPaged([], {
        page: 1,
        pageSize: 25,
      });

      expect(result).toEqual({
        items: [],
        page: 1,
        pageSize: 25,
        hasNext: false,
        totalItems: 0,
      });
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('paginates results and sets hasNext when an extra row is returned', async () => {
      installPagedHistoryDbMock(mockDb, {
        rows: [
          sampleRow({ id: 1 }),
          sampleRow({ id: 2 }),
          sampleRow({ id: 3 }),
        ],
        totalCount: 3,
        users: [{ id: 2, adDisplayName: 'Alice', adUsername: 'alice' }],
      });

      const result = await service.getActivityHistoryForActivityIdsPaged([10], {
        page: 1,
        pageSize: 2,
      });

      expect(result.items).toHaveLength(2);
      expect(result.hasNext).toBe(true);
      expect(result.totalItems).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
    });

    it('queries all activities when activityIds is null', async () => {
      installPagedHistoryDbMock(mockDb, {
        rows: [sampleRow()],
        totalCount: 1,
        users: [{ id: 2, adDisplayName: 'Alice', adUsername: 'alice' }],
      });

      const result = await service.getActivityHistoryForActivityIdsPaged(null, {
        page: 1,
        pageSize: 25,
      });

      expect(result.items).toHaveLength(1);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('redacts scoped fields for restricted viewers in paged results', async () => {
      installPagedHistoryDbMock(mockDb, {
        rows: [
          sampleRow({
            changes: [
              { field: 'title', oldValue: 'A', newValue: 'B' },
              { field: 'notes', oldValue: 'secret', newValue: 'updated' },
            ],
          }),
        ],
        totalCount: 1,
        users: [{ id: 2, adDisplayName: 'Alice', adUsername: 'alice' }],
      });

      const result = await service.getActivityHistoryForActivityIdsPaged([10], {
        page: 1,
        pageSize: 25,
        viewer: {
          permissions: [],
          roleName: 'Viewer',
        },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.changes).toEqual([
        { field: 'title', oldValue: 'A', newValue: 'B' },
      ]);
    });

    it('accepts Pacific calendar date bounds and text query options', async () => {
      installPagedHistoryDbMock(mockDb, {
        rows: [sampleRow()],
        totalCount: 1,
        users: [{ id: 2, adDisplayName: 'Alice', adUsername: 'alice' }],
      });

      const result = await service.getActivityHistoryForActivityIdsPaged([10], {
        startDate: '2026-03-20',
        endDate: '2026-03-20',
        query: 'budget',
        actionTypes: ['updated'],
        userId: 2,
        page: 1,
        pageSize: 25,
      });

      expect(result.items).toHaveLength(1);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });
});
