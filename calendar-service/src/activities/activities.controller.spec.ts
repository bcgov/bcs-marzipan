import { Test, TestingModule } from '@nestjs/testing';

import type { Category } from '@corpcal/database/types';
import type { AuthUser } from '@corpcal/shared';

import {
  createMockActivityRequest,
  createMockActivityResponse,
  createMockUpdateRequest,
} from '../common/test-utils';
import type { RequestContext as RequestContextType } from '../policy/dto/user-context.dto';
import { CanCloneActivityGuard } from '../policy/guards/can-clone-activity.guard';
import { CanDeleteActivityGuard } from '../policy/guards/can-delete-activity.guard';
import { CanEditActivityGuard } from '../policy/guards/can-edit-activity.guard';
import { PolicyService } from '../policy/policy.service';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './services/activities.service';

const mockRequestContext: RequestContextType = {
  dataScope: { teamIds: [], bypass: true },
};

const mockUser: AuthUser = {
  id: 1,
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  roleId: 2,
  roleName: 'Editor',
  permissions: [
    'activities.create',
    'activities.edit',
    'activities.delete',
    'activities.notes.view',
    'activities.lookAhead.view',
    'activities.pitchStatus.view',
  ],
  teamIds: [],
};

describe('ActivitiesController', () => {
  let controller: ActivitiesController;

  const mockActivityResponse = createMockActivityResponse({
    lookAheadStatus: 'none',
    lookAheadSection: 'events',
  });

  const mockActivitiesService = {
    create: vi.fn(),
    clone: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    softDelete: vi.fn(),
    requestDelete: vi.fn(),
    restore: vi.fn(),
    cancelChanges: vi.fn(),
    updateCategories: vi.fn(),
    updateThemes: vi.fn(),
    updateTags: vi.fn(),
    updateSharedWith: vi.fn(),
    fetchCategories: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
        {
          provide: PolicyService,
          useValue: {
            isCommsLeadForActivity: vi.fn(),
            isCommsContactForActivity: vi.fn().mockResolvedValue(true),
            getLeadTeamIdForActivity: vi.fn().mockResolvedValue(10),
          },
        },
        CanCloneActivityGuard,
        CanDeleteActivityGuard,
        CanEditActivityGuard,
      ],
    }).compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new activity', async () => {
      const createDto = createMockActivityRequest({
        title: 'New Activity',
        summary: 'New summary',
      });

      mockActivitiesService.create.mockResolvedValue(mockActivityResponse);

      const result = await controller.create(createDto, mockUser);

      expect(result).toEqual({
        success: true,
        data: mockActivityResponse,
      });
      expect(mockActivitiesService.create).toHaveBeenCalledWith(
        createDto,
        mockUser.id,
        {
          roleName: mockUser.roleName,
          permissions: mockUser.permissions,
          teamIds: mockUser.teamIds,
        }
      );
      expect(mockActivitiesService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('clone', () => {
    it('delegates to the service with the source id, body, and user context', async () => {
      const cloneBody = {
        title: 'CLONED Budget announcement',
        startDate: '2025-02-01',
        endDate: '2025-02-01',
        startTime: null,
        endTime: null,
        isAllDay: true,
        includeFieldPaths: ['tagIds', 'significance'],
        activityHistoryNotes: 'Cloning for Q2',
      };

      mockActivitiesService.clone.mockResolvedValue(mockActivityResponse);

      const result = await controller.clone(42, cloneBody, mockUser);

      expect(result).toEqual({
        success: true,
        data: mockActivityResponse,
      });
      expect(mockActivitiesService.clone).toHaveBeenCalledWith(
        42,
        cloneBody,
        mockUser.id,
        {
          roleName: mockUser.roleName,
          permissions: mockUser.permissions,
          teamIds: mockUser.teamIds,
        }
      );
      expect(mockActivitiesService.clone).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all activities', async () => {
      const activities = [mockActivityResponse];
      mockActivitiesService.findAll.mockResolvedValue(activities);

      const result = await controller.findAll(
        { page: 1, limit: 10 },
        {} as Parameters<ActivitiesController['findAll']>[1]
      );

      expect(result).toEqual({
        success: true,
        data: activities,
      });
      expect(mockActivitiesService.findAll).toHaveBeenCalledWith(undefined, {});
    });

    it('should return filtered activities', async () => {
      const activities = [mockActivityResponse];
      const filters = {
        page: 1,
        limit: 10,
        title: 'Test',
      };
      mockActivitiesService.findAll.mockResolvedValue(activities);

      const result = await controller.findAll(
        filters,
        {} as Parameters<ActivitiesController['findAll']>[1]
      );

      expect(result).toEqual({
        success: true,
        data: activities,
      });
      expect(mockActivitiesService.findAll).toHaveBeenCalledWith(filters, {});
    });
  });

  describe('fetchCategories', () => {
    it('should return all categories', async () => {
      const categories: Category[] = [
        {
          id: 1,
          name: 'Education',
          displayName: 'Education',
          sortOrder: 1,
          isActive: true,
          visibility: 'global',
          description: '',
          createdDateTime: new Date(),
          lastUpdatedDateTime: new Date(),
          createdBy: 1,
          lastUpdatedBy: 1,
        },
        {
          id: 2,
          name: 'Health',
          displayName: 'Health',
          sortOrder: 2,
          isActive: true,
          visibility: 'global',
          description: '',
          createdDateTime: new Date(),
          lastUpdatedDateTime: new Date(),
          createdBy: 1,
          lastUpdatedBy: 1,
        },
      ];
      mockActivitiesService.fetchCategories.mockResolvedValue(categories);

      const result = await controller.fetchCategories();

      expect(result).toEqual({
        success: true,
        data: categories,
      });
      expect(mockActivitiesService.fetchCategories).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single activity by ID', async () => {
      mockActivitiesService.findOne.mockResolvedValue(mockActivityResponse);

      const result = await controller.findOne(1, mockRequestContext);

      expect(result).toEqual({
        success: true,
        data: mockActivityResponse,
      });
      expect(mockActivitiesService.findOne).toHaveBeenCalledWith(
        1,
        mockRequestContext
      );
      expect(mockActivitiesService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException for non-existent activity', async () => {
      mockActivitiesService.findOne.mockRejectedValue(
        new Error('Activity not found')
      );

      await expect(
        controller.findOne(999, mockRequestContext)
      ).rejects.toThrow();
      expect(mockActivitiesService.findOne).toHaveBeenCalledWith(
        999,
        mockRequestContext
      );
    });
  });

  describe('update', () => {
    it('should update an activity', async () => {
      const updateDto = createMockUpdateRequest({
        title: 'Updated Title',
        summary: 'Updated summary',
      });

      const updatedActivity = {
        ...mockActivityResponse,
        ...updateDto,
      };

      mockActivitiesService.update.mockResolvedValue(updatedActivity);

      const result = await controller.update(1, updateDto, mockUser);

      expect(result).toEqual({
        success: true,
        data: updatedActivity,
      });
      expect(mockActivitiesService.update).toHaveBeenCalledWith(
        1,
        updateDto,
        mockUser.id,
        {
          roleName: mockUser.roleName,
          permissions: mockUser.permissions,
          teamIds: mockUser.teamIds,
        }
      );
      expect(mockActivitiesService.update).toHaveBeenCalledTimes(1);
    });

    it('should throw error when updating non-existent activity', async () => {
      const updateDto = createMockUpdateRequest({
        title: 'Updated Title',
      });

      mockActivitiesService.update.mockRejectedValue(
        new Error('Activity not found')
      );

      await expect(
        controller.update(999, updateDto, mockUser)
      ).rejects.toThrow();
      expect(mockActivitiesService.update).toHaveBeenCalledWith(
        999,
        updateDto,
        mockUser.id,
        {
          roleName: mockUser.roleName,
          permissions: mockUser.permissions,
          teamIds: mockUser.teamIds,
        }
      );
    });
  });

  describe('remove', () => {
    it('should delete an activity', async () => {
      const deleteResponse = { message: 'Activity #1 deleted successfully' };
      mockActivitiesService.remove.mockResolvedValue(deleteResponse);

      const result = await controller.remove(1, mockUser);

      expect(result).toEqual(deleteResponse);
      expect(mockActivitiesService.remove).toHaveBeenCalledWith(
        1,
        mockUser.id,
        {
          permissions: mockUser.permissions,
          teamIds: mockUser.teamIds,
        },
        { reason: undefined }
      );
      expect(mockActivitiesService.remove).toHaveBeenCalledTimes(1);
    });

    it('should pass reason to service when body.reason is provided', async () => {
      const deleteResponse = { message: 'Activity #1 deleted successfully' };
      mockActivitiesService.remove.mockResolvedValue(deleteResponse);

      await controller.remove(1, mockUser, {
        reason: 'Duplicate and no longer needed',
      });

      expect(mockActivitiesService.remove).toHaveBeenCalledWith(
        1,
        mockUser.id,
        {
          permissions: mockUser.permissions,
          teamIds: mockUser.teamIds,
        },
        { reason: 'Duplicate and no longer needed' }
      );
    });

    it('should throw error when deleting non-existent activity', async () => {
      mockActivitiesService.remove.mockRejectedValue(
        new Error('Activity not found')
      );

      await expect(controller.remove(999, mockUser)).rejects.toThrow();
      expect(mockActivitiesService.remove).toHaveBeenCalledWith(
        999,
        mockUser.id,
        {
          permissions: mockUser.permissions,
          teamIds: mockUser.teamIds,
        },
        { reason: undefined }
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete an activity', async () => {
      const body = { reason: 'Duplicate entry' };
      mockActivitiesService.softDelete.mockResolvedValue(mockActivityResponse);

      const result = await controller.softDelete(1, body, mockUser);

      expect(result).toEqual({
        success: true,
        data: mockActivityResponse,
      });
      expect(mockActivitiesService.softDelete).toHaveBeenCalledWith(
        1,
        body.reason,
        mockUser.id,
        { permissions: mockUser.permissions, teamIds: mockUser.teamIds }
      );
      expect(mockActivitiesService.softDelete).toHaveBeenCalledTimes(1);
    });

    it('should throw error when soft deleting non-existent activity', async () => {
      const body = { reason: 'No longer needed' };
      mockActivitiesService.softDelete.mockRejectedValue(
        new Error('Activity not found')
      );

      await expect(
        controller.softDelete(999, body, mockUser)
      ).rejects.toThrow();
      expect(mockActivitiesService.softDelete).toHaveBeenCalledWith(
        999,
        body.reason,
        mockUser.id,
        { permissions: mockUser.permissions, teamIds: mockUser.teamIds }
      );
    });
  });

  describe('requestDelete', () => {
    it('should request delete and return activity', async () => {
      const body = { reason: 'Requesting removal as comms contact' };
      mockActivitiesService.requestDelete.mockResolvedValue(
        mockActivityResponse
      );

      const result = await controller.requestDelete(1, body, mockUser);

      expect(result).toEqual({
        success: true,
        data: mockActivityResponse,
      });
      expect(mockActivitiesService.requestDelete).toHaveBeenCalledWith(
        1,
        body.reason,
        mockUser.id
      );
      expect(mockActivitiesService.requestDelete).toHaveBeenCalledTimes(1);
    });

    it('should throw when requestDelete fails', async () => {
      const body = { reason: 'Duplicate or obsolete' };
      mockActivitiesService.requestDelete.mockRejectedValue(
        new Error('Activity not found')
      );

      await expect(
        controller.requestDelete(999, body, mockUser)
      ).rejects.toThrow();
      expect(mockActivitiesService.requestDelete).toHaveBeenCalledWith(
        999,
        body.reason,
        mockUser.id
      );
    });
  });

  describe('restore', () => {
    it('should restore activity and return updated activity', async () => {
      const body = { note: 'Restored after review' };
      mockActivitiesService.restore.mockResolvedValue(mockActivityResponse);

      const result = await controller.restore(1, body, mockUser);

      expect(result).toEqual({
        success: true,
        data: mockActivityResponse,
      });
      expect(mockActivitiesService.restore).toHaveBeenCalledWith(
        1,
        mockUser.id,
        body.note,
        { roleName: mockUser.roleName }
      );
      expect(mockActivitiesService.restore).toHaveBeenCalledTimes(1);
    });

    it('should restore with no note', async () => {
      const body = {};
      mockActivitiesService.restore.mockResolvedValue(mockActivityResponse);

      await controller.restore(1, body, mockUser);

      expect(mockActivitiesService.restore).toHaveBeenCalledWith(
        1,
        mockUser.id,
        undefined,
        { roleName: mockUser.roleName }
      );
    });
  });
});
