import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { createMockUpdateTeamBody } from '../common/test-utils';
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
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return list with memberCount and ministryCount', async () => {
      const teamRows = [
        {
          id: 1,
          name: 'Team A',
          displayName: 'Team A Display',
          description: 'Desc',
          sortOrder: 0,
          isActive: true,
        },
      ];
      const memberCounts = [{ teamId: 1, count: 2 }];
      const ministryCounts = [{ teamId: 1, count: 1 }];

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain(teamRows, 'orderBy'))
        .mockReturnValueOnce(createChain(memberCounts, 'groupBy'))
        .mockReturnValueOnce(createChain(ministryCounts, 'groupBy'));

      const result = await service.findAll(true);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        name: 'Team A',
        memberCount: 2,
        ministryCount: 1,
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

  describe('findOne', () => {
    it('should return null when team does not exist', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([], 'limit'));

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });

    it('should return TeamDetail with members and ministries when team exists', async () => {
      const teamRow = {
        id: 1,
        name: 'Team One',
        displayName: 'Team One',
        description: null,
        sortOrder: 0,
        isActive: true,
      };
      const memberRows = [{ userId: 10, role: 'owner' }];
      const ministryRows = [{ ministryId: 1 }];
      const userRows = [
        { id: 10, adDisplayName: 'User Ten', adUsername: 'user10' },
      ];
      const ministryNameRows = [{ id: 1, displayName: 'Premier' }];

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([teamRow], 'limit'))
        .mockReturnValueOnce(createChain(memberRows, 'where'))
        .mockReturnValueOnce(createChain(ministryRows, 'where'))
        .mockReturnValueOnce(createChain(userRows, 'where'))
        .mockReturnValueOnce(createChain(ministryNameRows, 'where'));

      const result = await service.findOne(1);

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        id: 1,
        name: 'Team One',
        memberCount: 1,
        ministryCount: 1,
      });
      expect(result!.members).toHaveLength(1);
      expect(result!.members[0]).toMatchObject({
        userId: 10,
        userName: 'User Ten',
        role: 'owner',
      });
      expect(result!.ministries).toHaveLength(1);
      expect(result!.ministries[0]).toMatchObject({
        ministryId: 1,
        ministryName: 'Premier',
      });
    });
  });

  describe('create', () => {
    it('should insert team, optional team_ministries, record history, and return detail', async () => {
      const dto = createMockCreateTeamBody({
        name: 'New Team',
        ministryIds: ['1', '2'],
      });
      const insertedTeam = {
        id: 5,
        name: 'New Team',
        displayName: null,
        description: null,
        sortOrder: 0,
        isActive: true,
      };
      const insertValues = vi.fn().mockReturnThis();
      const insertReturning = vi.fn().mockResolvedValue([insertedTeam]);

      mockDatabaseService.db.insert = vi.fn().mockReturnValue({
        values: insertValues,
        returning: insertReturning,
      });

      const ministryNameRows = [
        { id: 1, displayName: 'M1' },
        { id: 2, displayName: 'M2' },
      ];
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([insertedTeam], 'limit'))
        .mockReturnValueOnce(createChain([], 'where'))
        .mockReturnValueOnce(
          createChain([{ ministryId: 1 }, { ministryId: 2 }], 'where')
        )
        .mockReturnValueOnce(createChain(ministryNameRows, 'where'));

      const result = await service.create(dto, 1);

      expect(result).not.toBeNull();
      expect(result.id).toBe(5);
      expect(result.name).toBe('New Team');
      expect(result.ministryCount).toBe(2);
      expect(mockDatabaseService.db.insert).toHaveBeenCalled();
      expect(insertValues).toHaveBeenCalled();
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
        description: null,
        sortOrder: 0,
        isActive: true,
      };
      const updatedTeamRow = { ...teamRow, name: 'Updated Name' };
      const memberRows: { userId: number; role: string }[] = [];
      const ministryRows: { ministryId: number }[] = [];

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([teamRow], 'limit'))
        .mockReturnValueOnce(createChain(memberRows, 'where'))
        .mockReturnValueOnce(createChain(ministryRows, 'where'))
        .mockReturnValueOnce(createChain([updatedTeamRow], 'limit'))
        .mockReturnValueOnce(createChain(memberRows, 'where'))
        .mockReturnValueOnce(createChain(ministryRows, 'where'));

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
        description: null,
        sortOrder: 0,
        isActive: true,
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
});
