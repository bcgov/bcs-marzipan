import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import type {
  CreateActivityRequest,
  UpdateActivityRequest,
} from '@corpcal/shared/schemas';
import type { ActivityResponse } from '@corpcal/shared/api';
import { Category } from '@corpcal/shared';

describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let service: ActivitiesService;

  const mockActivityResponse: ActivityResponse = {
    id: 1,
    displayId: 'ACT-1',
    activityStatusId: '1',
    title: 'Test Activity',
    summary: 'Test summary',
    isIssue: false,
    oicRelated: false,
    isActive: true,
    leadOrg: null,
    significance: null,
    pitchStatus: 'Pending',
    pitchComments: null,
    confidential: false,
    schedulingStatus: 'Confirmed',
    isAllDay: false,
    startDate: '2025-01-15',
    startTime: '10:00',
    endDate: '2025-01-15',
    endTime: '12:00',
    isTimeConfirmed: true,
    isDateConfirmed: true,
    schedulingConsiderations: null,
    commsLead: null,
    eventLeadOrg: null,
    eventLead: null,
    eventLeadName: null,
    videographer: null,
    graphics: null,
    notForLookAhead: false,
    lookAheadStatus: null,
    lookAheadSection: null,
    planningReport: false,
    thirtySixtyNinetyReport: false,
    calendarVisibility: null,
    venueAddress: null,
    newsReleaseId: null,
    createdDateTime: new Date().toISOString(),
    lastUpdatedDateTime: new Date().toISOString(),
    createdBy: 'test-user',
    lastUpdatedBy: 'test-user',
    category: ['Education'],
    owner: null,
  };

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
    service = module.get<ActivitiesService>(ActivitiesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new activity', async () => {
      const createDto: CreateActivityRequest = {
        title: 'New Activity',
        summary: 'New summary',
        isIssue: false,
        oicRelated: false,
        isActive: true,
        isAllDay: false,
        startDate: '2025-01-15',
        startTime: '10:00',
        endDate: '2025-01-15',
        endTime: '12:00',
        isTimeConfirmed: true,
        isDateConfirmed: true,
        isConfidential: false,
        notForLookAhead: false,
        planningReport: false,
        thirtySixtyNinetyReport: false,
      };

      mockActivitiesService.create.mockResolvedValue(mockActivityResponse);

      const result = await controller.create(createDto);

      expect(result).toEqual({
        success: true,
        data: mockActivityResponse,
      });
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(service.create).toHaveBeenCalledTimes(1);
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
      expect(service.findAll).toHaveBeenCalledWith(undefined);
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
      expect(service.findAll).toHaveBeenCalledWith(filters);
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
          pitchNotRequired: false,
          description: '',
          timestamp: new Date(),
        },
        {
          id: 2,
          name: 'Health',
          displayName: 'Health',
          sortOrder: 2,
          isActive: true,
          pitchNotRequired: false,
          description: '',
          timestamp: new Date(),
        },
      ];
      mockActivitiesService.fetchCategories.mockResolvedValue(categories);

      const result = await controller.fetchCategories();

      expect(result).toEqual({
        success: true,
        data: categories,
      });
      expect(service.fetchCategories).toHaveBeenCalledTimes(1);
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
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException for non-existent activity', async () => {
      mockActivitiesService.findOne.mockRejectedValue(
        new Error('Activity not found')
      );

      await expect(controller.findOne(999)).rejects.toThrow();
      expect(service.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('update', () => {
    it('should update an activity', async () => {
      const updateDto = {
        title: 'Updated Title',
        summary: 'Updated summary',
      } as unknown as UpdateActivityRequest;

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
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should throw error when updating non-existent activity', async () => {
      const updateDto = {
        title: 'Updated Title',
      } as unknown as UpdateActivityRequest;

      mockActivitiesService.update.mockRejectedValue(
        new Error('Activity not found')
      );

      await expect(controller.update(999, updateDto)).rejects.toThrow();
      expect(service.update).toHaveBeenCalledWith(999, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete an activity', async () => {
      const deleteResponse = { message: 'Activity with ID 1 has been deleted' };
      mockActivitiesService.remove.mockResolvedValue(deleteResponse);

      const result = await controller.remove(1);

      expect(result).toEqual(deleteResponse);
      expect(service.remove).toHaveBeenCalledWith(1);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should throw error when deleting non-existent activity', async () => {
      mockActivitiesService.remove.mockRejectedValue(
        new Error('Activity not found')
      );

      await expect(controller.remove(999)).rejects.toThrow();
      expect(service.remove).toHaveBeenCalledWith(999);
    });
  });
});
