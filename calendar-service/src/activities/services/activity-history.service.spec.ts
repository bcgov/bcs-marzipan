import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseService } from '../../database/database.service';
import { ActivityHistoryService } from './activity-history.service';

describe('ActivityHistoryService', () => {
  let service: ActivityHistoryService;
  let mockDb: {
    select: ReturnType<typeof vi.fn>;
    from: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
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

    it('should skip all audit fields', () => {
      const changes = service.generateChangeList(
        {
          id: 1,
          createdDateTime: 'a',
          lastUpdatedDateTime: 'b',
          rowVersion: 1,
          displayId: 'X-001',
        },
        {
          id: 2,
          createdDateTime: 'c',
          lastUpdatedDateTime: 'd',
          rowVersion: 2,
          displayId: 'X-002',
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
});
