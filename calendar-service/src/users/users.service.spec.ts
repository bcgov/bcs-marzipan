import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ActivityHistoryService } from '../activities/services/activity-history.service';
import {
  createMockAddUserToTeamBody,
  createMockTransferActivitiesBody,
  createMockUpdateUserTeamRoleBody,
} from '../common/test-utils';
import { DatabaseService } from '../database/database.service';
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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    vi.clearAllMocks();
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
    it('should throw NotFoundException when user not in team', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([], 'limit'));

      await expect(service.removeUserFromTeam(1, 2, 1)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should soft-update and record history on success', async () => {
      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(createChain([{ role: 'member' }], 'limit'));

      mockDatabaseService.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      });

      await expect(
        service.removeUserFromTeam(1, 2, 1)
      ).resolves.toBeUndefined();
      expect(mockDatabaseService.db.update).toHaveBeenCalled();
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
        .mockReturnValueOnce(createChain([{ id: 99 }], 'limit'));

      const activityChain = createChain(
        [
          { id: 1, title: 'Activity One' },
          { id: 2, title: 'Activity Two' },
        ],
        'orderBy'
      );
      mockDatabaseService.db.selectDistinct = vi
        .fn()
        .mockReturnValue(activityChain);

      const result = await service.getActivitiesForUser(1);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        label: 'Activity One',
        value: 1,
      });
      expect(result[1]).toMatchObject({
        id: 2,
        label: 'Activity Two',
        value: 2,
      });
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
    it('should throw BadRequestException when source and target are same', async () => {
      await expect(
        service.transferActivities(
          1,
          createMockTransferActivitiesBody({ targetUserId: 1 }),
          1
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when both transfer flags false', async () => {
      await expect(
        service.transferActivities(
          1,
          createMockTransferActivitiesBody({
            targetUserId: 2,
            transferCommsLead: false,
            transferCommsContact: false,
          }),
          1
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should record 0 and return transferredCount 0 when no activities', async () => {
      mockDatabaseService.db.selectDistinct = vi
        .fn()
        .mockReturnValue(createChain([], 'where'));

      mockDatabaseService.db.insert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const result = await service.transferActivities(
        1,
        createMockTransferActivitiesBody({
          targetUserId: 2,
          activityIds: [],
          transferCommsLead: true,
          transferCommsContact: true,
        }),
        1
      );

      expect(result).toEqual({ transferredCount: 0 });
    });

    it('should update activity_comms_contacts and return transferredCount', async () => {
      mockDatabaseService.db.transaction = vi.fn(
        async (cb: (tx: typeof mockDatabaseService.db) => Promise<number>) =>
          cb(mockDatabaseService.db)
      );

      mockDatabaseService.db.select = vi
        .fn()
        .mockReturnValueOnce(
          createChain(
            [
              { activityId: 10, isLead: true },
              { activityId: 11, isLead: false },
            ],
            'where'
          )
        )
        .mockReturnValueOnce(createChain([], 'where'))
        .mockReturnValueOnce(createChain([], 'limit'))
        .mockReturnValueOnce(createChain([], 'limit'));

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
          activityIds: [10, 11],
          transferCommsLead: true,
          transferCommsContact: true,
        }),
        1
      );

      expect(result).toEqual({ transferredCount: 2 });
      expect(mockDatabaseService.db.transaction).toHaveBeenCalledTimes(1);
      expect(mockActivityHistoryService.recordChange).toHaveBeenCalledTimes(1);
    });
  });
});
