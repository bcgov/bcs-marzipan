import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

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
    it('should return list with memberCount and ministryId/ministryName', async () => {
      const teamRows = [
        {
          id: 1,
          name: 'Team A',
          displayName: 'Team A Display',
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
        description: null,
        sortOrder: 0,
        isActive: true,
        roleId: null,
        ministryId: 1,
      };
      const memberRows = [{ userId: 10, role: 'owner' }];
      const userRows = [
        { id: 10, adDisplayName: 'User Ten', adUsername: 'user10' },
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
        expect.objectContaining({ ministryId: 1 })
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
});
