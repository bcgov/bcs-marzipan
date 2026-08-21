import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ActivityHistoryService } from '../activities/services/activity-history.service';
import { ActivityUtilsService } from '../activities/services/activity-utils.service';
import {
  createMockAddUserToTeamBody,
  createMockTransferActivitiesBody,
  createMockUpdateUserTeamRoleBody,
} from '../common/test-utils';
import { DatabaseService } from '../database/database.service';
import { TeamsService } from '../teams/teams.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  type Terminal = 'limit' | 'orderBy' | 'where' | 'groupBy' | 'from';
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
      innerJoin: vi.fn(),
      leftJoin: vi.fn(),
    };
    chain.from.mockReturnValue(chain);
    chain.where.mockReturnValue(chain);
    chain.orderBy.mockReturnValue(chain);
    chain.limit.mockReturnValue(chain);
    chain.groupBy.mockReturnValue(chain);
    chain.innerJoin.mockReturnValue(chain);
    chain.leftJoin.mockReturnValue(chain);
    (chain[terminal] as ReturnType<typeof vi.fn>).mockResolvedValue(value);
    return chain;
  };

  const mockDatabaseService = {
    db: {
      select: vi.fn().mockReturnThis(),
      selectDistinct: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      transaction: vi.fn(),
    },
  };

  const mockActivityHistoryService = {
    recordChange: vi.fn().mockResolvedValue(undefined),
  };

  const mockActivityUtilsService = {
    computeDisplayIdFromLeadContext: vi.fn().mockReturnValue('TEAM-000001'),
  };

  const mockTeamsService = {
    getEligibleCommsUserIds: vi.fn().mockResolvedValue(new Set<number>()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: ActivityHistoryService,
          useValue: mockActivityHistoryService,
        },
        {
          provide: ActivityUtilsService,
          useValue: mockActivityUtilsService,
        },
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    vi.clearAllMocks();
    mockTeamsService.getEligibleCommsUserIds.mockResolvedValue(
      new Set<number>()
    );
    mockActivityUtilsService.computeDisplayIdFromLeadContext.mockReturnValue(
      'TEAM-000001'
    );
  });

  describe('create', () => {
    it('should throw ConflictException when email already exists', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([{ id: 1 }], 'limit'));

      await expect(
        service.create(
          { email: 'existing@gov.bc.ca', idirUsername: 'JEXIST', roleId: 1 },
          1
        )
      ).rejects.toThrow(ConflictException);
      expect(mockDatabaseService.db.insert).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when roleId is invalid', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([], 'limit'))
        .mockReturnValueOnce(createChain([], 'limit'));

      await expect(
        service.create(
          { email: 'new@gov.bc.ca', idirUsername: 'JNEW', roleId: 999 },
          1
        )
      ).rejects.toThrow(BadRequestException);
      expect(mockDatabaseService.db.insert).not.toHaveBeenCalled();
    });

    it('should create user and return UserDetail', async () => {
      const userRow = {
        id: 1,
        adUsername: 'JNEWUSER',
        adDisplayName: 'New User',
        adEmail: 'newuser@gov.bc.ca',
        roleId: 2,
        isActive: true,
        notes: null,
      };
      const roleRow = [{ name: 'Editor' }];
      const teamRows: { teamId: number; role: string }[] = [];
      const teamNameRows: { id: number; name: string }[] = [];

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([], 'limit'))
        .mockReturnValueOnce(createChain([{ id: 2 }], 'limit'))
        .mockReturnValueOnce(createChain([userRow], 'limit'))
        .mockReturnValueOnce(createChain(roleRow, 'limit'))
        .mockReturnValueOnce(createChain(teamRows, 'where'))
        .mockReturnValueOnce(createChain(teamNameRows, 'where'));

      mockDatabaseService.db.insert = vi
        .fn()
        .mockImplementationOnce(() => ({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 1 }]),
          }),
        }))
        .mockImplementationOnce(() => ({
          values: vi.fn().mockResolvedValue(undefined),
        }))
        .mockReturnThis();

      const result = await service.create(
        {
          email: 'newuser@gov.bc.ca',
          idirUsername: 'jnewuser',
          roleId: 2,
          displayName: 'New User',
        },
        1
      );

      expect(result).not.toBeNull();
      expect(result.id).toBe(1);
      expect(result.adEmail).toBe('newuser@gov.bc.ca');
      expect(result.adUsername).toBe('JNEWUSER');
      expect(result.roleId).toBe(2);
      expect(mockDatabaseService.db.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('findAll', () => {
    it('should return list with teams per user', async () => {
      const userRows = [
        {
          id: 1,
          adUsername: 'u1',
          adDisplayName: 'User One',
          adEmail: 'u1@test.com',
          roleId: 2,
          isActive: true,
        },
      ];
      const roleRows = [
        { id: 1, name: 'Admin' },
        { id: 2, name: 'Editor' },
      ];
      const teamRows = [{ userId: 1, teamId: 10, role: 'member' }];
      const teamNameRows = [{ id: 10, name: 'Team Ten' }];

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain(userRows, 'orderBy'))
        .mockReturnValueOnce(createChain(roleRows, 'from'))
        .mockReturnValueOnce(createChain(teamRows, 'where'))
        .mockReturnValueOnce(createChain(teamNameRows, 'where'));

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        adUsername: 'u1',
        roleName: 'Editor',
        isActive: true,
      });
      expect(result[0].teams).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return null when user does not exist', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([], 'limit'));

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });

    it('should return UserDetail with teams when user exists', async () => {
      const userRow = {
        id: 1,
        adUsername: 'u1',
        adDisplayName: 'User One',
        adEmail: 'u1@test.com',
        roleId: 2,
        isActive: true,
        notes: null,
      };
      const roleRow = [{ name: 'Editor' }];
      const teamRows = [{ teamId: 10, role: 'member' }];
      const teamNameRows = [{ id: 10, name: 'Team Ten' }];

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([userRow], 'limit'))
        .mockReturnValueOnce(createChain(roleRow, 'limit'))
        .mockReturnValueOnce(createChain(teamRows, 'where'))
        .mockReturnValueOnce(createChain(teamNameRows, 'where'));

      const result = await service.findOne(1);

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        id: 1,
        adUsername: 'u1',
        roleName: 'Editor',
      });
      expect(result!.teams).toHaveLength(1);
      expect(result!.teams[0]).toMatchObject({
        teamId: 10,
        teamName: 'Team Ten',
        role: 'member',
      });
    });
  });

  describe('update', () => {
    it('should throw NotFoundException when user not found', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([], 'limit'));

      await expect(service.update(999, { roleId: 2 }, 1)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should update user and record history when changes exist', async () => {
      const userRow = {
        id: 1,
        adUsername: 'u1',
        adDisplayName: 'User One',
        adEmail: 'u1@test.com',
        roleId: 1,
        isActive: true,
        notes: null,
      };
      const roleRow = [{ name: 'Admin' }];
      const teamRows: { teamId: number; role: string }[] = [];
      const updatedUserRow = { ...userRow, roleId: 2 };

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([userRow], 'limit'))
        .mockReturnValueOnce(createChain(roleRow, 'limit'))
        .mockReturnValueOnce(createChain(teamRows, 'where'))
        .mockReturnValueOnce(createChain([updatedUserRow], 'limit'))
        .mockReturnValueOnce(createChain([{ name: 'Editor' }], 'limit'))
        .mockReturnValueOnce(createChain(teamRows, 'where'));

      mockDatabaseService.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      });

      const result = await service.update(1, { roleId: 2 }, 1);

      expect(result).not.toBeNull();
      expect(result.roleId).toBe(2);
    });

    it('should reject non-BC Gov email updates', async () => {
      const userRow = {
        id: 1,
        adUsername: 'u1',
        adDisplayName: 'User One',
        adEmail: 'u1@gov.bc.ca',
        roleId: 1,
        isActive: true,
        notes: null,
      };
      const roleRow = [{ name: 'Admin' }];
      const teamRows: { teamId: number; role: string }[] = [];

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([userRow], 'limit'))
        .mockReturnValueOnce(createChain(roleRow, 'limit'))
        .mockReturnValueOnce(createChain(teamRows, 'where'));

      await expect(
        service.update(1, { email: 'user@example.com' }, 1)
      ).rejects.toThrow(BadRequestException);
      expect(mockDatabaseService.db.update).not.toHaveBeenCalled();
    });

    it('should reject null email updates', async () => {
      const userRow = {
        id: 1,
        adUsername: 'u1',
        adDisplayName: 'User One',
        adEmail: 'u1@gov.bc.ca',
        roleId: 1,
        isActive: true,
        notes: null,
      };
      const roleRow = [{ name: 'Admin' }];
      const teamRows: { teamId: number; role: string }[] = [];

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([userRow], 'limit'))
        .mockReturnValueOnce(createChain(roleRow, 'limit'))
        .mockReturnValueOnce(createChain(teamRows, 'where'));

      await expect(service.update(1, { email: null } as any, 1)).rejects.toThrow(
        BadRequestException
      );
      expect(mockDatabaseService.db.update).not.toHaveBeenCalled();
    });
  });

  describe('addUserToTeam', () => {
    it('should throw NotFoundException when user not found', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([], 'limit'));

      await expect(
        service.addUserToTeam(999, createMockAddUserToTeamBody(), 1)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when user already in team', async () => {
      const userRow = {
        id: 1,
        adUsername: 'u1',
        adDisplayName: 'User One',
        adEmail: 'u1@test.com',
        roleId: 2,
        isActive: true,
        notes: null,
      };
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([userRow], 'limit'))
        .mockReturnValueOnce(createChain([{ name: 'Editor' }], 'limit'))
        .mockReturnValueOnce(createChain([], 'where'))
        .mockReturnValueOnce(
          createChain([{ userId: 1, teamId: 1, isActive: true }], 'limit')
        );

      await expect(
        service.addUserToTeam(1, createMockAddUserToTeamBody({ teamId: 1 }), 1)
      ).rejects.toThrow(ConflictException);
    });

    it('should insert user_teams and record history on success', async () => {
      const userRow = {
        id: 1,
        adUsername: 'u1',
        adDisplayName: 'User One',
        adEmail: 'u1@test.com',
        roleId: 2,
        isActive: true,
        notes: null,
      };
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([userRow], 'limit'))
        .mockReturnValueOnce(createChain([{ name: 'Editor' }], 'limit'))
        .mockReturnValueOnce(createChain([], 'where'))
        .mockReturnValueOnce(createChain([], 'limit'));

      mockDatabaseService.db.insert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      await expect(
        service.addUserToTeam(1, createMockAddUserToTeamBody({ teamId: 2 }), 1)
      ).resolves.toBeUndefined();
      expect(mockDatabaseService.db.insert).toHaveBeenCalled();
    });

    it('should reactivate existing inactive membership', async () => {
      const userRow = {
        id: 1,
        adUsername: 'u1',
        adDisplayName: 'User One',
        adEmail: 'u1@test.com',
        roleId: 2,
        isActive: true,
        notes: null,
      };

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([userRow], 'limit'))
        .mockReturnValueOnce(createChain([{ name: 'Editor' }], 'limit'))
        .mockReturnValueOnce(createChain([], 'where'))
        .mockReturnValueOnce(
          createChain([{ userId: 1, teamId: 2, isActive: false }], 'limit')
        );

      mockDatabaseService.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      });

      await expect(
        service.addUserToTeam(1, createMockAddUserToTeamBody({ teamId: 2 }), 1)
      ).resolves.toBeUndefined();
      expect(mockDatabaseService.db.update).toHaveBeenCalled();
      expect(mockDatabaseService.db.insert).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeUserFromTeam', () => {
    const stubTransactionPassthrough = () => {
      mockDatabaseService.db.transaction = vi.fn(
        async (cb: (tx: typeof mockDatabaseService.db) => Promise<number>) =>
          cb(mockDatabaseService.db)
      );
      mockDatabaseService.db.delete = vi
        .fn()
        .mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
      mockDatabaseService.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      });
      mockDatabaseService.db.insert = vi
        .fn()
        .mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
    };

    it('should throw NotFoundException when user not in team', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([], 'limit'));

      await expect(service.removeUserFromTeam(1, 2, 1)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should silently remove (no comms, no body) and clear flags + membership', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([{ role: 'member' }], 'limit')) // active membership check
        .mockReturnValueOnce(createChain([{ id: 99 }], 'limit')) // deleted status lookup
        .mockReturnValueOnce(createChain([], 'where')); // scoped comms rows: none

      stubTransactionPassthrough();

      const result = await service.removeUserFromTeam(1, 2, 1);

      expect(result).toEqual({ transferredCount: 0 });
      expect(mockDatabaseService.db.delete).toHaveBeenCalledTimes(1);
      expect(mockDatabaseService.db.update).toHaveBeenCalledTimes(1);
      expect(mockDatabaseService.db.insert).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when scoped comms exist but no targetUserId given', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([{ role: 'member' }], 'limit'))
        .mockReturnValueOnce(createChain([{ id: 99 }], 'limit'))
        .mockReturnValueOnce(
          createChain([{ activityId: 10, isLead: true }], 'where')
        );

      await expect(service.removeUserFromTeam(1, 2, 1)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should transfer scoped comms, clear flags, and deactivate membership', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([{ role: 'member' }], 'limit')) // active membership check
        .mockReturnValueOnce(createChain([{ id: 99 }], 'limit')) // deleted status lookup
        .mockReturnValueOnce(
          createChain(
            [
              { activityId: 10, isLead: true },
              { activityId: 11, isLead: false },
            ],
            'where'
          )
        ) // scoped comms rows
        .mockReturnValueOnce(
          createChain(
            [
              { id: 1, adDisplayName: 'Source User', adUsername: null },
              { id: 2, adDisplayName: 'Target User', adUsername: null },
            ],
            'where'
          )
        ) // display names
        .mockReturnValueOnce(createChain([], 'limit')) // transferSingleCommsRow target-row check (activity 10)
        .mockReturnValueOnce(createChain([], 'limit')); // transferSingleCommsRow target-row check (activity 11) — n/a since not lead & includeNonLead false, but harmless if unused

      mockTeamsService.getEligibleCommsUserIds.mockResolvedValue(new Set([2]));
      stubTransactionPassthrough();

      const result = await service.removeUserFromTeam(1, 2, 1, {
        targetUserId: 2,
        includeNonLead: false,
      });

      expect(result).toEqual({ transferredCount: 2 });
      expect(mockDatabaseService.db.delete).toHaveBeenCalled();
      expect(mockDatabaseService.db.update).toHaveBeenCalled();
      expect(mockActivityHistoryService.recordChange).toHaveBeenCalledWith(
        10,
        1,
        'comms_lead_transferred',
        expect.any(Array),
        undefined,
        mockDatabaseService.db
      );
    });
  });

  describe('updateUserTeamRole', () => {
    it('should throw NotFoundException when user not in team', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([], 'limit'));

      await expect(
        service.updateUserTeamRole(
          1,
          2,
          createMockUpdateUserTeamRoleBody({ role: 'owner' }),
          1
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should do nothing when role unchanged', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([{ role: 'member' }], 'limit'));

      await expect(
        service.updateUserTeamRole(
          1,
          2,
          createMockUpdateUserTeamRoleBody({ role: 'member' }),
          1
        )
      ).resolves.toBeUndefined();
      expect(mockDatabaseService.db.update).not.toHaveBeenCalled();
    });

    it('should update role and record history when role changed', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([{ role: 'member' }], 'limit'));

      mockDatabaseService.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      });

      await expect(
        service.updateUserTeamRole(
          1,
          2,
          createMockUpdateUserTeamRoleBody({ role: 'owner' }),
          1
        )
      ).resolves.toBeUndefined();
      expect(mockDatabaseService.db.update).toHaveBeenCalled();
    });
  });

  describe('getUserHistory', () => {
    it('should return history entries with changedByUserName', async () => {
      const historyRows = [
        {
          id: 1,
          userId: 1,
          changedByUserId: 2,
          actionType: 'role_changed',
          changes: null,
          notes: null,
          timestamp: new Date(),
        },
      ];
      const userRows = [{ id: 2, adDisplayName: 'Admin', adUsername: 'admin' }];

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain(historyRows, 'orderBy'))
        .mockReturnValueOnce(createChain(userRows, 'where'));

      const result = await service.getUserHistory(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: 1,
        actionType: 'role_changed',
        changedByUserId: 2,
      });
      expect(result[0].changedByUserName).toBeDefined();
    });
  });

  describe('getActivitiesForUser', () => {
    it('should return activities where user is comms contact', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([{ id: 99 }], 'limit'))
        .mockReturnValueOnce(
          createChain(
            [
              { id: 1, title: 'Activity One', isLead: true },
              { id: 2, title: 'Activity Two', isLead: false },
            ],
            'orderBy'
          )
        );

      const result = await service.getActivitiesForUser(1);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        label: 'Activity One',
        value: 1,
        isLead: true,
      });
      expect(result[1]).toMatchObject({
        id: 2,
        label: 'Activity Two',
        value: 2,
        isLead: false,
      });
    });

    it('should scope by fromTeamId when provided', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([{ id: 99 }], 'limit'))
        .mockReturnValueOnce(
          createChain(
            [{ id: 1, title: 'Scoped Activity', isLead: true }],
            'orderBy'
          )
        );

      const result = await service.getActivitiesForUser(1, 5);

      expect(result).toEqual([
        { id: 1, label: 'Scoped Activity', value: 1, isLead: true },
      ]);
    });
  });

  describe('getActivityCountsForUsers', () => {
    it('should return empty array for empty userIds', async () => {
      const result = await service.getActivityCountsForUsers([]);

      expect(result).toEqual([]);
      expect(mockDatabaseService.db.select).not.toHaveBeenCalled();
    });

    it('should return counts per requested user and fill missing with zero', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([{ id: 99 }], 'limit'))
        .mockReturnValueOnce(
          createChain(
            [
              { userId: 1, activityCount: 2 },
              { userId: 3, activityCount: 5 },
            ],
            'groupBy'
          )
        );

      const result = await service.getActivityCountsForUsers([1, 2, 3, 3]);

      expect(result).toEqual([
        { userId: 1, activityCount: 2 },
        { userId: 2, activityCount: 0 },
        { userId: 3, activityCount: 5 },
      ]);
    });
  });

  describe('transferActivities', () => {
    const activeTeamMembership = () => createChain([{ userId: 1 }], 'limit');

    it('should throw BadRequestException when source and target are same', async () => {
      await expect(
        service.transferActivities(
          1,
          createMockTransferActivitiesBody({ targetUserId: 1, fromTeamId: 1 }),
          1
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when activityIds are outside the fromTeamId scope', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(activeTeamMembership())
        .mockReturnValueOnce(createChain([{ id: 99 }], 'limit'))
        .mockReturnValueOnce(
          createChain([{ activityId: 10, isLead: true }], 'where')
        );

      await expect(
        service.transferActivities(
          1,
          createMockTransferActivitiesBody({
            targetUserId: 2,
            fromTeamId: 1,
            activityIds: [10, 999],
          }),
          1
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when target user is not comms-eligible for the destination team', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(activeTeamMembership())
        .mockReturnValueOnce(createChain([{ id: 99 }], 'limit'))
        .mockReturnValueOnce(
          createChain([{ activityId: 10, isLead: true }], 'where')
        );
      mockTeamsService.getEligibleCommsUserIds.mockResolvedValue(
        new Set([999])
      );

      await expect(
        service.transferActivities(
          1,
          createMockTransferActivitiesBody({
            targetUserId: 2,
            fromTeamId: 1,
            activityIds: [10],
          }),
          1
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no activities are in scope', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(activeTeamMembership())
        .mockReturnValueOnce(createChain([{ id: 99 }], 'limit'))
        .mockReturnValueOnce(createChain([], 'where'));

      await expect(
        service.transferActivities(
          1,
          createMockTransferActivitiesBody({
            targetUserId: 2,
            fromTeamId: 1,
          }),
          1
        )
      ).rejects.toThrow(BadRequestException);

      expect(mockDatabaseService.db.insert).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when activityIds is an explicit empty array', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(activeTeamMembership())
        .mockReturnValueOnce(createChain([{ id: 99 }], 'limit'))
        .mockReturnValueOnce(
          createChain([{ activityId: 10, isLead: true }], 'where')
        );

      await expect(
        service.transferActivities(
          1,
          createMockTransferActivitiesBody({
            targetUserId: 2,
            fromTeamId: 1,
            activityIds: [],
          }),
          1
        )
      ).rejects.toThrow(/activityIds must include at least one activity/i);
    });

    it('should throw BadRequestException when source user is not on fromTeamId', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([], 'limit'));

      await expect(
        service.transferActivities(
          1,
          createMockTransferActivitiesBody({
            targetUserId: 2,
            fromTeamId: 1,
          }),
          1
        )
      ).rejects.toThrow(/not an active member of team/i);
    });

    it('should throw BadRequestException when selected options would not change comms', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(activeTeamMembership())
        .mockReturnValueOnce(createChain([{ id: 99 }], 'limit'))
        .mockReturnValueOnce(
          createChain([{ activityId: 11, isLead: false }], 'where')
        );

      mockTeamsService.getEligibleCommsUserIds.mockResolvedValue(new Set([2]));

      await expect(
        service.transferActivities(
          1,
          createMockTransferActivitiesBody({
            targetUserId: 2,
            fromTeamId: 1,
            activityIds: [11],
            includeNonLead: false,
          }),
          1
        )
      ).rejects.toThrow(/No comms assignments would change/i);
    });

    it('should transfer lead and non-lead comms and return transferredCount', async () => {
      mockDatabaseService.db.transaction = vi.fn(
        async (cb: (tx: typeof mockDatabaseService.db) => Promise<number>) =>
          cb(mockDatabaseService.db)
      );

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(activeTeamMembership())
        .mockReturnValueOnce(createChain([{ id: 99 }], 'limit')) // deleted status
        .mockReturnValueOnce(
          createChain(
            [
              { activityId: 10, isLead: true },
              { activityId: 11, isLead: false },
            ],
            'where'
          )
        ) // scoped comms rows
        .mockReturnValueOnce(
          createChain(
            [
              { id: 1, adDisplayName: 'Source User', adUsername: null },
              { id: 2, adDisplayName: 'Target User', adUsername: null },
            ],
            'where'
          )
        ) // display names
        .mockReturnValueOnce(createChain([], 'limit')) // transferSingleCommsRow (activity 10)
        .mockReturnValueOnce(createChain([], 'limit')); // transferSingleCommsRow (activity 11)

      mockTeamsService.getEligibleCommsUserIds.mockResolvedValue(new Set([2]));

      mockDatabaseService.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      });

      mockDatabaseService.db.insert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const result = await service.transferActivities(
        1,
        createMockTransferActivitiesBody({
          targetUserId: 2,
          fromTeamId: 1,
          activityIds: [10, 11],
          includeNonLead: true,
        }),
        1
      );

      expect(result).toEqual({ transferredCount: 2 });
      expect(mockDatabaseService.db.transaction).toHaveBeenCalledTimes(1);
      expect(mockActivityHistoryService.recordChange).toHaveBeenCalledTimes(1);
      expect(mockActivityHistoryService.recordChange).toHaveBeenCalledWith(
        10,
        1,
        'comms_lead_transferred',
        expect.any(Array),
        undefined,
        mockDatabaseService.db
      );
    });

    it('should reactivate an existing inactive target comms row when merging', async () => {
      const setMock = vi.fn().mockReturnThis();
      mockDatabaseService.db.transaction = vi.fn(
        async (cb: (tx: typeof mockDatabaseService.db) => Promise<number>) =>
          cb(mockDatabaseService.db)
      );

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(activeTeamMembership())
        .mockReturnValueOnce(createChain([{ id: 99 }], 'limit'))
        .mockReturnValueOnce(
          createChain([{ activityId: 10, isLead: true }], 'where')
        )
        .mockReturnValueOnce(
          createChain(
            [
              { id: 1, adDisplayName: 'Source User', adUsername: null },
              { id: 2, adDisplayName: 'Target User', adUsername: null },
            ],
            'where'
          )
        )
        .mockReturnValueOnce(createChain([{ isLead: false }], 'limit'));

      mockTeamsService.getEligibleCommsUserIds.mockResolvedValue(new Set([2]));

      mockDatabaseService.db.update = vi.fn().mockReturnValue({
        set: setMock,
        where: vi.fn().mockResolvedValue(undefined),
      });
      mockDatabaseService.db.delete = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });
      mockDatabaseService.db.insert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      await service.transferActivities(
        1,
        createMockTransferActivitiesBody({
          targetUserId: 2,
          fromTeamId: 1,
          activityIds: [10],
          includeNonLead: false,
        }),
        1
      );

      expect(setMock).toHaveBeenCalledWith({
        isLead: true,
        isActive: true,
      });
    });

    it('should delete non-lead comms in removal-equivalent scenarios (includeNonLead false, cross-team, source ineligible)', async () => {
      mockDatabaseService.db.transaction = vi.fn(
        async (cb: (tx: typeof mockDatabaseService.db) => Promise<number>) =>
          cb(mockDatabaseService.db)
      );

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(activeTeamMembership())
        .mockReturnValueOnce(createChain([{ id: 99 }], 'limit')) // deleted status
        .mockReturnValueOnce(
          createChain([{ activityId: 20, isLead: false }], 'where')
        ) // scoped comms rows (non-lead only)
        .mockReturnValueOnce(
          createChain(
            [{ id: 1, adDisplayName: 'Source User', adUsername: null }],
            'where'
          )
        ) // display names (target not included since lead never transfers here, only source resolved)
        .mockReturnValueOnce(
          createChain([{ abbreviation: 'DEST', ministryId: null }], 'limit')
        ); // resolveCrossTeamContext team lookup

      // Target team eligibility (used for both target validation and source-eligibility check).
      // Non-lead is not transferred (includeNonLead false) and source (1) is not eligible on team 2.
      mockTeamsService.getEligibleCommsUserIds.mockResolvedValue(new Set([2]));

      mockDatabaseService.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      });
      mockDatabaseService.db.delete = vi
        .fn()
        .mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
      mockDatabaseService.db.insert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const result = await service.transferActivities(
        1,
        createMockTransferActivitiesBody({
          targetUserId: 2,
          fromTeamId: 1,
          toTeamId: 2,
          activityIds: [20],
          includeNonLead: false,
        }),
        1
      );

      expect(result).toEqual({ transferredCount: 1 });
      expect(mockDatabaseService.db.delete).toHaveBeenCalledTimes(1);
      expect(mockDatabaseService.db.update).toHaveBeenCalled(); // activities.leadTeamId cross-team update
    });
  });
});
