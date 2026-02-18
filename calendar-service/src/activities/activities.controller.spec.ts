import { Test, TestingModule } from '@nestjs/testing';

import type { Category } from '@corpcal/database/types';
import type { AuthUser } from '@corpcal/shared';

import {
  createMockActivityRequest,
  createMockActivityResponse,
  createMockUpdateRequest,
} from '../common/test-utils';
import type { RequestContext as RequestContextType } from '../policy/dto/user-context.dto';
import { CanDeleteActivityGuard } from '../policy/guards/can-delete-activity.guard';
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
  permissions: ['activities.create', 'activities.edit', 'activities.delete'],
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
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    softDelete: vi.fn(),
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
          useValue: { isCommsLeadForActivity: vi.fn() },
        },
        CanDeleteActivityGuard,
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
        mockUser.id
      );
      expect(mockActivitiesService.create).toHaveBeenCalledTimes(1);
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
      expect(mockActivitiesService.findAll).toHaveBeenCalledWith(
        undefined,
        undefined
      );
    });

    it('should return filtered activities', async () => {
      const activities = [mockActivityResponse];
      const filters = { page: 1, limit: 10, title: 'Test' };
      mockActivitiesService.findAll.mockResolvedValue(activities);

      const result = await controller.findAll(
        filters,
        {} as Parameters<ActivitiesController['findAll']>[1]
      );

      expect(result).toEqual({
        success: true,
        data: activities,
      });
      expect(mockActivitiesService.findAll).toHaveBeenCalledWith(
        filters,
        undefined
      );
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
        mockRequestContext.dataScope
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
        mockRequestContext.dataScope
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
        mockUser.id
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
        mockUser.id
      );
    });
  });

  describe('remove', () => {
    it('should delete an activity', async () => {
      const deleteResponse = { message: 'Activity #1 deleted successfully' };
      mockActivitiesService.remove.mockResolvedValue(deleteResponse);

      const result = await controller.remove(1, mockUser);

      expect(result).toEqual(deleteResponse);
      expect(mockActivitiesService.remove).toHaveBeenCalledWith(1, mockUser.id);
      expect(mockActivitiesService.remove).toHaveBeenCalledTimes(1);
    });

    it('should throw error when deleting non-existent activity', async () => {
      mockActivitiesService.remove.mockRejectedValue(
        new Error('Activity not found')
      );

      await expect(controller.remove(999, mockUser)).rejects.toThrow();
      expect(mockActivitiesService.remove).toHaveBeenCalledWith(
        999,
        mockUser.id
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
        mockUser.id
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
        mockUser.id
      );
    });
  });
});
