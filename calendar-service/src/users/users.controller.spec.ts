import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import type { AuthUser } from '@corpcal/shared';

import { AuthService } from '../auth/auth.service';
import {
  createMockAddUserToTeamBody,
  createMockTransferActivitiesBody,
  createMockUpdateUserTeamRoleBody,
  createMockUserDetail,
  createMockUserHistoryEntry,
  createMockUserListItem,
} from '../common/test-utils';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUser: AuthUser = {
  id: 1,
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@gov.bc.ca',
  roleId: 5,
  roleName: 'Admin',
  permissions: ['users.view', 'users.edit', 'users.transfer_activities'],
  teamIds: [],
};

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    getActivitiesForUser: vi.fn(),
    getActivityCountsForUsers: vi.fn(),
    addUserToTeam: vi.fn(),
    removeUserFromTeam: vi.fn(),
    updateUserTeamRole: vi.fn(),
    getUserHistory: vi.fn(),
    transferActivities: vi.fn(),
  };

  const mockAuthService = {
    createPasswordResetToken: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return users list with optional search', async () => {
      const users = [createMockUserListItem()];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll(undefined);

      expect(result).toEqual({ success: true, data: users });
      expect(mockUsersService.findAll).toHaveBeenCalledWith(undefined, [], []);
      expect(mockUsersService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should pass search query to service', async () => {
      const users = [createMockUserListItem()];
      mockUsersService.findAll.mockResolvedValue(users);

      await controller.findAll('john');

      expect(mockUsersService.findAll).toHaveBeenCalledWith('john', [], []);
    });
  });

  describe('create', () => {
    it('should create user and return 201 with data', async () => {
      const dto = {
        email: 'newuser@gov.bc.ca',
        idirUsername: 'JNEWUSER',
        roleId: 2,
        displayName: 'New User',
      };
      const created = createMockUserDetail({
        id: 99,
        adEmail: 'newuser@gov.bc.ca',
        roleId: 2,
        adDisplayName: 'New User',
      });
      mockUsersService.create.mockResolvedValue(created);

      const result = await controller.create(dto, mockUser);

      expect(result).toEqual({ success: true, data: created });
      expect(mockUsersService.create).toHaveBeenCalledWith(dto, mockUser.id);
      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
    });

    it('should throw when service throws ConflictException for duplicate email', async () => {
      const dto = {
        email: 'existing@gov.bc.ca',
        idirUsername: 'JEXIST',
        roleId: 1,
      };
      mockUsersService.create.mockRejectedValue(
        new ConflictException('A user with this email already exists.')
      );

      await expect(controller.create(dto, mockUser)).rejects.toThrow(
        'A user with this email already exists'
      );
      expect(mockUsersService.create).toHaveBeenCalledWith(dto, mockUser.id);
    });
  });

  describe('getActivities', () => {
    it('should return activities for user', async () => {
      const activities = [
        { id: 1, label: 'Activity One', value: 1, isLead: true },
        { id: 2, label: 'Activity Two', value: 2, isLead: false },
      ];
      mockUsersService.getActivitiesForUser.mockResolvedValue(activities);

      const result = await controller.getActivities(1);

      expect(result).toEqual({ success: true, data: activities });
      expect(mockUsersService.getActivitiesForUser).toHaveBeenCalledWith(
        1,
        undefined
      );
      expect(mockUsersService.getActivitiesForUser).toHaveBeenCalledTimes(1);
    });

    it('should pass fromTeamId scope when provided', async () => {
      mockUsersService.getActivitiesForUser.mockResolvedValue([]);

      await controller.getActivities(1, '5');

      expect(mockUsersService.getActivitiesForUser).toHaveBeenCalledWith(1, 5);
    });

    it('should throw BadRequestException for a non-integer fromTeamId', async () => {
      await expect(controller.getActivities(1, 'not-a-number')).rejects.toThrow(
        'fromTeamId must be an integer'
      );
    });
  });

  describe('getActivityCounts', () => {
    it('should return activity counts for requested users', async () => {
      const counts = [
        { userId: 1, activityCount: 3 },
        { userId: 2, activityCount: 0 },
      ];
      mockUsersService.getActivityCountsForUsers.mockResolvedValue(counts);

      const result = await controller.getActivityCounts('1,2');

      expect(result).toEqual({ success: true, data: counts });
      expect(mockUsersService.getActivityCountsForUsers).toHaveBeenCalledWith([
        1, 2,
      ]);
      expect(mockUsersService.getActivityCountsForUsers).toHaveBeenCalledTimes(
        1
      );
    });
  });

  describe('findOne', () => {
    it('should return user detail by ID', async () => {
      const user = createMockUserDetail({ id: 5 });
      mockUsersService.findOne.mockResolvedValue(user);

      const result = await controller.findOne(5);

      expect(result).toEqual({ success: true, data: user });
      expect(mockUsersService.findOne).toHaveBeenCalledWith(5);
      expect(mockUsersService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return success with null data when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(999);

      expect(result).toEqual({ success: true, data: null });
      expect(mockUsersService.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('update', () => {
    it('should update user and return updated detail', async () => {
      const dto = { roleId: 2, isActive: true };
      const updated = createMockUserDetail({ id: 1, roleId: 2 });
      mockUsersService.update.mockResolvedValue(updated);

      const result = await controller.update(1, dto, mockUser);

      expect(result).toEqual({ success: true, data: updated });
      expect(mockUsersService.update).toHaveBeenCalledWith(1, dto, mockUser.id);
      expect(mockUsersService.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('addToTeam', () => {
    it('should add user to team and return success', async () => {
      mockUsersService.addUserToTeam.mockResolvedValue(undefined);

      const dto = createMockAddUserToTeamBody({ teamId: 2, role: 'member' });
      const result = await controller.addToTeam(1, dto, mockUser);

      expect(result).toEqual({ success: true });
      expect(mockUsersService.addUserToTeam).toHaveBeenCalledWith(
        1,
        dto,
        mockUser.id
      );
      expect(mockUsersService.addUserToTeam).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeFromTeam', () => {
    it('should remove user from team with no body (silent removal)', async () => {
      mockUsersService.removeUserFromTeam.mockResolvedValue({
        transferredCount: 0,
      });

      const result = await controller.removeFromTeam(
        1,
        2,
        { includeNonLead: false },
        mockUser
      );

      expect(result).toEqual({ success: true, transferredCount: 0 });
      expect(mockUsersService.removeUserFromTeam).toHaveBeenCalledWith(
        1,
        2,
        mockUser.id,
        { includeNonLead: false }
      );
      expect(mockUsersService.removeUserFromTeam).toHaveBeenCalledTimes(1);
    });

    it('should remove user from team and transfer activities when targetUserId is provided', async () => {
      mockUsersService.removeUserFromTeam.mockResolvedValue({
        transferredCount: 3,
      });

      const dto = { targetUserId: 5, includeNonLead: true };
      const result = await controller.removeFromTeam(1, 2, dto, mockUser);

      expect(result).toEqual({ success: true, transferredCount: 3 });
      expect(mockUsersService.removeUserFromTeam).toHaveBeenCalledWith(
        1,
        2,
        mockUser.id,
        dto
      );
    });

    it('should throw ForbiddenException when transferring without transfer permission', async () => {
      const userWithoutTransfer: AuthUser = {
        ...mockUser,
        permissions: ['users.view', 'users.edit'],
      };

      await expect(
        controller.removeFromTeam(
          1,
          2,
          { targetUserId: 5, includeNonLead: false },
          userWithoutTransfer
        )
      ).rejects.toThrow('You do not have permission to transfer activities.');
      expect(mockUsersService.removeUserFromTeam).not.toHaveBeenCalled();
    });
  });

  describe('updateTeamRole', () => {
    it('should update user role in team and return success', async () => {
      mockUsersService.updateUserTeamRole.mockResolvedValue(undefined);

      const dto = createMockUpdateUserTeamRoleBody({ role: 'owner' });
      const result = await controller.updateTeamRole(1, 2, dto, mockUser);

      expect(result).toEqual({ success: true });
      expect(mockUsersService.updateUserTeamRole).toHaveBeenCalledWith(
        1,
        2,
        dto,
        mockUser.id
      );
      expect(mockUsersService.updateUserTeamRole).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHistory', () => {
    it('should return user history entries', async () => {
      const history = [
        createMockUserHistoryEntry({ id: 1, actionType: 'role_changed' }),
        createMockUserHistoryEntry({ id: 2, actionType: 'team_added' }),
      ];
      mockUsersService.getUserHistory.mockResolvedValue(history);

      const result = await controller.getHistory(1);

      expect(result).toEqual({ success: true, data: history });
      expect(mockUsersService.getUserHistory).toHaveBeenCalledWith(1);
      expect(mockUsersService.getUserHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('transferActivities', () => {
    it('should transfer activities and return transferredCount', async () => {
      mockUsersService.transferActivities.mockResolvedValue({
        transferredCount: 3,
      });

      const dto = createMockTransferActivitiesBody({
        targetUserId: 2,
        fromTeamId: 1,
        includeNonLead: true,
      });
      const result = await controller.transferActivities(1, dto, mockUser);

      expect(result).toEqual({ success: true, transferredCount: 3 });
      expect(mockUsersService.transferActivities).toHaveBeenCalledWith(
        1,
        dto,
        mockUser.id
      );
      expect(mockUsersService.transferActivities).toHaveBeenCalledTimes(1);
    });
  });

  describe('initiatePasswordReset', () => {
    it('should return reset code and expiry when token is created', async () => {
      mockAuthService.createPasswordResetToken.mockResolvedValue('abc123');

      const result = await controller.initiatePasswordReset(7);

      expect(result).toEqual({ resetCode: 'abc123', expiresInHours: 48 });
      expect(mockAuthService.createPasswordResetToken).toHaveBeenCalledWith(7);
      expect(mockAuthService.createPasswordResetToken).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors thrown by authService', async () => {
      mockAuthService.createPasswordResetToken.mockRejectedValue(
        new Error('User not found')
      );

      await expect(controller.initiatePasswordReset(99)).rejects.toThrow(
        'User not found'
      );
    });
  });
});
