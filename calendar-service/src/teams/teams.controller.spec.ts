import { Test, TestingModule } from '@nestjs/testing';

import type { AuthUser } from '@corpcal/shared';

import {
  createMockCreateTeamBody,
  createMockTeamDetail,
  createMockTeamHistoryEntry,
  createMockTeamListItem,
  createMockUpdateTeamBody,
} from '../common/test-utils';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

const mockUser: AuthUser = {
  id: 1,
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  roleId: 5,
  roleName: 'Admin',
  permissions: ['teams.view', 'teams.create', 'teams.edit'],
  teamIds: [],
};

describe('TeamsController', () => {
  let controller: TeamsController;

  const mockTeamsService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    getTeamHistory: vi.fn(),
    findLeadOptions: vi.fn(),
    findCommsContactCandidates: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
      ],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return teams with activeOnly true when query is undefined', async () => {
      const teams = [createMockTeamListItem()];
      mockTeamsService.findAll.mockResolvedValue(teams);

      const result = await controller.findAll(undefined);

      expect(result).toEqual({ success: true, data: teams });
      expect(mockTeamsService.findAll).toHaveBeenCalledWith(true);
      expect(mockTeamsService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should pass activeOnly true when query is "true"', async () => {
      const teams = [createMockTeamListItem()];
      mockTeamsService.findAll.mockResolvedValue(teams);

      await controller.findAll('true');

      expect(mockTeamsService.findAll).toHaveBeenCalledWith(true);
    });

    it('should pass activeOnly false when query is "false"', async () => {
      const teams = [createMockTeamListItem({ isActive: false })];
      mockTeamsService.findAll.mockResolvedValue(teams);

      await controller.findAll('false');

      expect(mockTeamsService.findAll).toHaveBeenCalledWith(false);
    });
  });

  describe('findOne', () => {
    it('should return team detail by ID', async () => {
      const team = createMockTeamDetail({ id: 5 });
      mockTeamsService.findOne.mockResolvedValue(team);

      const result = await controller.findOne(5);

      expect(result).toEqual({ success: true, data: team });
      expect(mockTeamsService.findOne).toHaveBeenCalledWith(5, false);
      expect(mockTeamsService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return success with null data when team not found', async () => {
      mockTeamsService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(999);

      expect(result).toEqual({ success: true, data: null });
      expect(mockTeamsService.findOne).toHaveBeenCalledWith(999, false);
    });
  });

  describe('create', () => {
    it('should create a team and return 201 shape', async () => {
      const dto = createMockCreateTeamBody({ name: 'New Team' });
      const created = createMockTeamDetail({ id: 10, name: 'New Team' });
      mockTeamsService.create.mockResolvedValue(created);

      const result = await controller.create(dto, mockUser);

      expect(result).toEqual({ success: true, data: created });
      expect(mockTeamsService.create).toHaveBeenCalledWith(dto, mockUser.id);
      expect(mockTeamsService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a team and return updated detail', async () => {
      const dto = createMockUpdateTeamBody({ name: 'Updated Name' });
      const updated = createMockTeamDetail({ id: 1, name: 'Updated Name' });
      mockTeamsService.update.mockResolvedValue(updated);

      const result = await controller.update(1, dto, mockUser);

      expect(result).toEqual({ success: true, data: updated });
      expect(mockTeamsService.update).toHaveBeenCalledWith(1, dto, mockUser.id);
      expect(mockTeamsService.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCommsContactCandidates', () => {
    it('should return candidates from service for team the user belongs to', async () => {
      const candidates = [{ id: 2, label: 'Editor User', value: 2 }];
      mockTeamsService.findCommsContactCandidates.mockResolvedValue(candidates);

      const user: AuthUser = {
        ...mockUser,
        permissions: ['activities.create', 'activities.edit'],
        teamIds: [5],
      };

      const result = await controller.getCommsContactCandidates(5, user);

      expect(result).toEqual({ success: true, data: candidates });
      expect(mockTeamsService.findCommsContactCandidates).toHaveBeenCalledWith(
        5,
        [5],
        false
      );
    });

    it('should allow candidates from any team with activities.create.any', async () => {
      mockTeamsService.findCommsContactCandidates.mockResolvedValue([]);

      const adminUser: AuthUser = {
        ...mockUser,
        permissions: [
          'activities.create',
          'activities.edit',
          'activities.create.any',
        ],
        teamIds: [2],
      };

      await controller.getCommsContactCandidates(99, adminUser);

      expect(mockTeamsService.findCommsContactCandidates).toHaveBeenCalledWith(
        99,
        [2],
        true
      );
    });

    it('should allow candidates from any team with users.transfer_activities', async () => {
      mockTeamsService.findCommsContactCandidates.mockResolvedValue([]);

      const transferUser: AuthUser = {
        ...mockUser,
        permissions: ['users.transfer_activities'],
        teamIds: [2],
      };

      await controller.getCommsContactCandidates(99, transferUser);

      expect(mockTeamsService.findCommsContactCandidates).toHaveBeenCalledWith(
        99,
        [2],
        true
      );
    });
  });

  describe('getHistory', () => {
    it('should return team history entries', async () => {
      const history = [
        createMockTeamHistoryEntry({ id: 1, actionType: 'created' }),
        createMockTeamHistoryEntry({ id: 2, actionType: 'updated' }),
      ];
      mockTeamsService.getTeamHistory.mockResolvedValue(history);

      const result = await controller.getHistory(1);

      expect(result).toEqual({ success: true, data: history });
      expect(mockTeamsService.getTeamHistory).toHaveBeenCalledWith(1);
      expect(mockTeamsService.getTeamHistory).toHaveBeenCalledTimes(1);
    });
  });
});
