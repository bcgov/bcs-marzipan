import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { Category } from '@corpcal/shared';
import {
  createMockActivityRequest,
  createMockUpdateRequest,
  createMockActivityResponse,
} from '../common/test-utils';

describe('ActivitiesController', () => {
  let controller: ActivitiesController;

  const mockActivityResponse = createMockActivityResponse({
    lookAheadStatus: 'none',
    lookAheadSection: 'events',
    tags: undefined,
    jointOrg: undefined,
    relatedActivities: undefined,
    commsMaterials: undefined,
    translationsRequired: undefined,
    jointEventOrg: undefined,
    representativesAttending: undefined,
    sharedWith: undefined,
    canEdit: undefined,
    canView: undefined,
  });

  const mockActivitiesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    fetchCategories: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
      ],
    }).compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

      const result = await controller.create(createDto);

      expect(result).toEqual({
        success: true,
        data: mockActivityResponse,
      });
      expect(mockActivitiesService.create).toHaveBeenCalledWith(createDto);
      expect(mockActivitiesService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all activities', async () => {
      const activities = [mockActivityResponse];
      mockActivitiesService.findAll.mockResolvedValue(activities);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        success: true,
        data: activities,
      });
      expect(mockActivitiesService.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return filtered activities', async () => {
      const activities = [mockActivityResponse];
      const filters = { page: 1, limit: 10, title: 'Test' };
      mockActivitiesService.findAll.mockResolvedValue(activities);

      const result = await controller.findAll(filters);

      expect(result).toEqual({
        success: true,
        data: activities,
      });
      expect(mockActivitiesService.findAll).toHaveBeenCalledWith(filters);
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
          pitchRequired: true,
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
          pitchRequired: true,
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

      const result = await controller.findOne(1);

      expect(result).toEqual({
        success: true,
        data: mockActivityResponse,
      });
      expect(mockActivitiesService.findOne).toHaveBeenCalledWith(1);
      expect(mockActivitiesService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException for non-existent activity', async () => {
      mockActivitiesService.findOne.mockRejectedValue(
        new Error('Activity not found')
      );

      await expect(controller.findOne(999)).rejects.toThrow();
      expect(mockActivitiesService.findOne).toHaveBeenCalledWith(999);
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

      const result = await controller.update(1, updateDto);

      expect(result).toEqual({
        success: true,
        data: updatedActivity,
      });
      expect(mockActivitiesService.update).toHaveBeenCalledWith(1, updateDto);
      expect(mockActivitiesService.update).toHaveBeenCalledTimes(1);
    });

    it('should throw error when updating non-existent activity', async () => {
      const updateDto = createMockUpdateRequest({
        title: 'Updated Title',
      });

      mockActivitiesService.update.mockRejectedValue(
        new Error('Activity not found')
      );

      await expect(controller.update(999, updateDto)).rejects.toThrow();
      expect(mockActivitiesService.update).toHaveBeenCalledWith(999, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete an activity', async () => {
      const deleteResponse = { message: 'Activity with ID 1 has been deleted' };
      mockActivitiesService.remove.mockResolvedValue(deleteResponse);

      const result = await controller.remove(1);

      expect(result).toEqual(deleteResponse);
      expect(mockActivitiesService.remove).toHaveBeenCalledWith(1);
      expect(mockActivitiesService.remove).toHaveBeenCalledTimes(1);
    });

    it('should throw error when deleting non-existent activity', async () => {
      mockActivitiesService.remove.mockRejectedValue(
        new Error('Activity not found')
      );

      await expect(controller.remove(999)).rejects.toThrow();
      expect(mockActivitiesService.remove).toHaveBeenCalledWith(999);
    });
  });
});
