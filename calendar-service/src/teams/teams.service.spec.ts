import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ActivityDisplayIdSyncService } from '../activities/services/activity-display-id-sync.service';
import {
  createMockCreateTeamBody,
  createMockUpdateTeamBody,
} from '../common/test-utils';
import { DatabaseService } from '../database/database.service';
import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  let service: TeamsService;

  type Terminal = 'limit' | 'orderBy' | 'where' | 'groupBy';
  const createChain = (
    resolvedValue: unknown,
    terminal: Terminal = 'limit'
  ) => {
    const value = Array.isArray(resolvedValue)
      ? resolvedValue
      : [resolvedValue];
    const chain = {
      from: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      groupBy: vi.fn(),
      limit: vi.fn(),
    };
    chain.from.mockReturnValue(chain);
    chain.where.mockReturnValue(chain);
    chain.orderBy.mockReturnValue(chain);
    chain.limit.mockReturnValue(chain);
    chain.groupBy.mockReturnValue(chain);
    (chain[terminal] as ReturnType<typeof vi.fn>).mockResolvedValue(value);
    return chain;
  };

  const mockDatabaseService = {
    db: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
      transaction: vi.fn((cb: (tx: unknown) => unknown) =>
        Promise.resolve(cb(mockDatabaseService.db))
      ),
    },
  };

  const mockActivityDisplayIdSyncService = {
    refreshAfterTeamAbbreviationChange: vi
      .fn()
      .mockResolvedValue({ updatedCount: 0 }),
    refreshAfterMinistryAbbreviationChange: vi
      .fn()
      .mockResolvedValue({ updatedCount: 0 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: ActivityDisplayIdSyncService,
          useValue: mockActivityDisplayIdSyncService,
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return list with memberCount and ministryId/ministryName', async () => {
      const teamRows = [
        {
          id: 1,
          name: 'Team A',
          displayName: 'Team A Display',
          abbreviation: 'TMA',
          description: 'Desc',
          sortOrder: 0,
          isActive: true,
          roleId: null,
          ministryId: 1,
        },
      ];
      const memberCounts = [{ teamId: 1, count: 2 }];
      const ministryNameRows = [{ id: 1, displayName: 'Ministry One' }];

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain(teamRows, 'orderBy'))
        .mockReturnValueOnce(createChain(memberCounts, 'groupBy'))
        .mockReturnValueOnce(createChain(ministryNameRows, 'where'));

      const result = await service.findAll(true);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        name: 'Team A',
        memberCount: 2,
        ministryId: 1,
        ministryName: 'Ministry One',
      });
    });

    it('should return empty array when no teams', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([], 'orderBy'));

      const result = await service.findAll(true);

      expect(result).toEqual([]);
    });
  });

  describe('findLeadOptions', () => {
    it('should return empty array when userTeamIds is empty and hasCreateAny is false', async () => {
      const result = await service.findLeadOptions([], false);
      expect(result).toEqual([]);
      expect(mockDatabaseService.db.select).not.toHaveBeenCalled();
    });

    it('should return all active teams when hasCreateAny is true', async () => {
      const activeTeamIds = [{ id: 1 }, { id: 2 }];
      const teamRows = [
        {
          id: 1,
          name: 'Team A',
          displayName: 'Team A',
          abbreviation: 'TMA',
          description: null,
          sortOrder: 0,
          isActive: true,
          roleId: 1,
          ministryId: 1,
        },
        {
          id: 2,
          name: 'Team B',
          displayName: 'Team B',
          abbreviation: 'TMB',
          description: null,
          sortOrder: 1,
          isActive: true,
          roleId: 2,
          ministryId: null,
        },
      ];
      const memberCounts = [
        { teamId: 1, count: 2 },
        { teamId: 2, count: 1 },
      ];
      const ministryNameRows = [{ id: 1, displayName: 'Ministry One' }];

      const chainWithWhere = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(activeTeamIds),
      };
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(chainWithWhere)
        .mockReturnValueOnce(createChain(teamRows, 'orderBy'))
        .mockReturnValueOnce(createChain(memberCounts, 'groupBy'))
        .mockReturnValueOnce(createChain(ministryNameRows, 'where'));

      const result = await service.findLeadOptions([], true);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        name: 'Team A',
        memberCount: 2,
        ministryId: 1,
        ministryName: 'Ministry One',
      });
      expect(result[1]).toMatchObject({
        id: 2,
        name: 'Team B',
        memberCount: 1,
        ministryId: null,
        ministryName: null,
      });
    });
  });

  describe('findOne', () => {
    it('should return null when team does not exist', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([], 'limit'));

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });

    it('should return TeamDetail with members and ministry when team exists', async () => {
      const teamRow = {
        id: 1,
        name: 'Team One',
        displayName: 'Team One',
        abbreviation: 'T1',
        description: null,
        sortOrder: 0,
        isActive: true,
        roleId: null,
        ministryId: 1,
      };
      const memberRows = [{ userId: 10, role: 'owner' }];
      const userRows = [
        {
          id: 10,
          adDisplayName: 'User Ten',
          adUsername: 'user10',
          adEmail: 'user10@example.com',
        },
      ];
      const ministryNameRows = [{ displayName: 'Premier' }];

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([teamRow], 'limit'))
        .mockReturnValueOnce(createChain(memberRows, 'where'))
        .mockReturnValueOnce(createChain(userRows, 'where'))
        .mockReturnValueOnce(createChain(ministryNameRows, 'limit'));

      const result = await service.findOne(1);

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        id: 1,
        name: 'Team One',
        ministryId: 1,
        ministryName: 'Premier',
        memberCount: 1,
      });
      expect(result!.members).toHaveLength(1);
      expect(result!.members[0]).toMatchObject({
        userId: 10,
        userName: 'User Ten',
        role: 'owner',
        adEmail: 'user10@example.com',
      });
    });
  });

  describe('create', () => {
    it('should insert team with ministryId, record history, and return detail', async () => {
      const dto = createMockCreateTeamBody({
        name: 'New Team',
        ministryId: 1,
      });
      const insertedTeam = {
        id: 5,
        name: 'New Team',
        displayName: null,
        abbreviation: 'NEW',
        description: null,
        sortOrder: 0,
        isActive: true,
        roleId: null,
        ministryId: 1,
      };
      const insertValues = vi.fn().mockReturnThis();
      const insertReturning = vi.fn().mockResolvedValue([insertedTeam]);

      mockDatabaseService.db.insert = vi.fn().mockReturnValue({
        values: insertValues,
        returning: insertReturning,
      });

      const ministryNameRows = [{ displayName: 'Ministry One' }];
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([insertedTeam], 'limit'))
        .mockReturnValueOnce(createChain([], 'where'))
        .mockReturnValueOnce(createChain(ministryNameRows, 'limit'));

      const result = await service.create(dto, 1);

      expect(result).not.toBeNull();
      expect(result.id).toBe(5);
      expect(result.name).toBe('New Team');
      expect(result.ministryId).toBe(1);
      expect(result.ministryName).toBe('Ministry One');
      expect(mockDatabaseService.db.insert).toHaveBeenCalled();
      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({ ministryId: 1, abbreviation: 'NEW' })
      );
    });
  });

  describe('update', () => {
    it('should throw NotFoundException when team not found', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([], 'limit'));

      await expect(
        service.update(999, createMockUpdateTeamBody(), 1)
      ).rejects.toThrow(NotFoundException);
    });

    it('should update team and return updated detail when team exists', async () => {
      const teamRow = {
        id: 1,
        name: 'Old Name',
        displayName: 'Old',
        abbreviation: 'OLD',
        description: null,
        sortOrder: 0,
        isActive: true,
        roleId: null,
        ministryId: null,
      };
      const updatedTeamRow = { ...teamRow, name: 'Updated Name' };
      const memberRows: { userId: number; role: string }[] = [];

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([teamRow], 'limit'))
        .mockReturnValueOnce(createChain(memberRows, 'where'))
        .mockReturnValueOnce(createChain([updatedTeamRow], 'limit'))
        .mockReturnValueOnce(createChain(memberRows, 'where'));

      mockDatabaseService.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      });

      const result = await service.update(
        1,
        createMockUpdateTeamBody({ name: 'Updated Name' }),
        1
      );

      expect(result).not.toBeNull();
      expect(result.name).toBe('Updated Name');
      expect(
        mockActivityDisplayIdSyncService.refreshAfterTeamAbbreviationChange
      ).not.toHaveBeenCalled();
    });

    it('cascades displayId refresh when the team abbreviation changes', async () => {
      const teamRow = {
        id: 1,
        name: 'Team',
        displayName: null,
        abbreviation: 'OLD',
        description: null,
        sortOrder: 0,
        isActive: true,
        roleId: null,
        ministryId: null,
      };
      const updatedTeamRow = { ...teamRow, abbreviation: 'NEW' };
      const memberRows: { userId: number; role: string }[] = [];

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([teamRow], 'limit'))
        .mockReturnValueOnce(createChain(memberRows, 'where'))
        .mockReturnValueOnce(createChain([updatedTeamRow], 'limit'))
        .mockReturnValueOnce(createChain(memberRows, 'where'));

      mockDatabaseService.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      });

      await service.update(
        1,
        createMockUpdateTeamBody({ abbreviation: 'NEW' }),
        42
      );

      expect(
        mockActivityDisplayIdSyncService.refreshAfterTeamAbbreviationChange
      ).toHaveBeenCalledTimes(1);
      expect(
        mockActivityDisplayIdSyncService.refreshAfterTeamAbbreviationChange
      ).toHaveBeenCalledWith(expect.anything(), 1, 42);
    });
  });

  describe('getTeamHistory', () => {
    it('should throw NotFoundException when team not found', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([], 'limit'));

      await expect(service.getTeamHistory(999)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should return history entries with changedByUserName when team exists', async () => {
      const teamRow = {
        id: 1,
        name: 'T',
        displayName: null,
        abbreviation: 'T',
        description: null,
        sortOrder: 0,
        isActive: true,
        roleId: null,
        ministryId: null,
      };
      const historyRows = [
        {
          id: 1,
          teamId: 1,
          changedByUserId: 2,
          actionType: 'created',
          changes: null,
          notes: null,
          timestamp: new Date(),
        },
      ];
      const userRows = [{ id: 2, adDisplayName: 'Admin', adUsername: 'admin' }];

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([teamRow], 'limit'))
        .mockReturnValueOnce(createChain([], 'where'))
        .mockReturnValueOnce(createChain(historyRows, 'orderBy'))
        .mockReturnValueOnce(createChain(userRows, 'where'));

      const result = await service.getTeamHistory(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        teamId: 1,
        actionType: 'created',
        changedByUserId: 2,
      });
      expect(result[0].changedByUserName).toBeDefined();
    });
  });

  describe('findCommsContactCandidates', () => {
    const createJoinChain = (resolvedValue: unknown) => {
      const chain = {
        from: vi.fn(),
        innerJoin: vi.fn(),
        where: vi.fn(),
      };
      chain.from.mockReturnValue(chain);
      chain.innerJoin.mockReturnValue(chain);
      chain.where.mockResolvedValue(
        Array.isArray(resolvedValue) ? resolvedValue : [resolvedValue]
      );
      return chain;
    };

    it('should throw ForbiddenException when caller is not on team and lacks create.any', async () => {
      await expect(
        service.findCommsContactCandidates(5, [1, 2], false)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow when caller is on the requested team', async () => {
      const userRows = [
        { id: 10, adDisplayName: 'Editor A', adUsername: 'editora' },
      ];
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createJoinChain(userRows));

      const result = await service.findCommsContactCandidates(5, [5, 6], false);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 10,
        label: 'Editor A',
        value: 10,
      });
    });

    it('should allow any team when hasCreateAny is true', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createJoinChain([]));

      const result = await service.findCommsContactCandidates(99, [], true);

      expect(result).toEqual([]);
    });

    it('should fall back to adUsername when adDisplayName is null', async () => {
      const userRows = [{ id: 7, adDisplayName: null, adUsername: 'user7' }];
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createJoinChain(userRows));

      const result = await service.findCommsContactCandidates(3, [3], false);

      expect(result[0].label).toBe('user7');
    });
  });

  describe('getEligibleCommsUserIds', () => {
    it('should return a Set of eligible user IDs', async () => {
      const rows = [
        { id: 2, adDisplayName: null, adUsername: null },
        { id: 5, adDisplayName: null, adUsername: null },
      ];
      const chain = {
        from: vi.fn(),
        innerJoin: vi.fn(),
        where: vi.fn(),
      };
      chain.from.mockReturnValue(chain);
      chain.innerJoin.mockReturnValue(chain);
      chain.where.mockResolvedValue(rows);
      mockDatabaseService.db.select = vi.fn().mockReturnValueOnce(chain);

      const result = await service.getEligibleCommsUserIds(5);

      expect(result).toBeInstanceOf(Set);
      expect(result.has(2)).toBe(true);
      expect(result.has(5)).toBe(true);
      expect(result.has(99)).toBe(false);
    });
  });
});
