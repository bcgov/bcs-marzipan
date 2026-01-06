import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { DatabaseService } from '../database/database.service';
import { ActivitiesGateway } from './activities.gateway';
import { activityResponseSchema } from '@corpcal/shared/schemas';
import type { Activity } from '@corpcal/database/types';
import type {
  CreateActivityRequest,
  UpdateActivityRequest,
} from '@corpcal/shared/schemas';
import { NotFoundException } from '@nestjs/common';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let databaseService: DatabaseService;
  let activitiesGateway: ActivitiesGateway;

  // Mock database service
  const mockDatabaseService = {
    db: {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      transaction: jest.fn(),
    },
  };

  // Mock activities gateway
  const mockActivitiesGateway = {
    notifyActivityUpdate: jest.fn(),
    broadcastActivityCreated: jest.fn(),
    server: {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    },
  };

  // Helper function to setup mocks for related data fetching
  const setupRelatedDataMocks = () => {
    // Mock all the fetch methods that retrieve related data
    jest
      .spyOn(service as any, 'fetchCategoriesForActivities')
      .mockResolvedValue(new Map());
    jest
      .spyOn(service as any, 'fetchTagsForActivities')
      .mockResolvedValue(new Map());
    jest
      .spyOn(service as any, 'fetchPitchStatusesForActivities')
      .mockResolvedValue(new Map([[1, 'Not Started']]));
    jest
      .spyOn(service as any, 'fetchSchedulingStatusesForActivities')
      .mockResolvedValue(new Map([[1, 'Tentative']]));
    jest
      .spyOn(service as any, 'fetchJointOrganizationsForActivities')
      .mockResolvedValue(new Map());
    jest
      .spyOn(service as any, 'fetchRelatedActivitiesForActivities')
      .mockResolvedValue(new Map());
    jest
      .spyOn(service as any, 'fetchCommsMaterialsForActivities')
      .mockResolvedValue(new Map());
    jest
      .spyOn(service as any, 'fetchTranslationsRequiredForActivities')
      .mockResolvedValue(new Map());
    jest
      .spyOn(service as any, 'fetchJointEventOrganizationsForActivities')
      .mockResolvedValue(new Map());
    jest
      .spyOn(service as any, 'fetchRepresentativesAttendingForActivities')
      .mockResolvedValue(new Map());
    jest
      .spyOn(service as any, 'fetchSharedWithOrganizationsForActivities')
      .mockResolvedValue(new Map());
    jest
      .spyOn(service as any, 'fetchCanEditUsersForActivities')
      .mockResolvedValue(new Map());
    jest
      .spyOn(service as any, 'fetchCanViewUsersForActivities')
      .mockResolvedValue(new Map());
  };

  // Helper to create a minimal valid Activity object for testing
  const createMockActivity = (overrides?: Partial<Activity>): Activity => {
    const now = new Date();
    return {
      id: 1,
      displayId: 'MIN-000001',
      activityStatusId: 1,
      title: 'Test Activity',
      summary: 'Test summary',
      isIssue: false,
      oicRelated: false,
      isActive: true,
      leadOrgId: null,
      significance: null,
      pitchStatusId: 1,
      pitchComments: null,
      isConfidential: false,
      schedulingStatusId: 1,
      isAllDay: false,
      startDate: new Date('2024-01-15'),
      startTime: '10:00',
      endDate: new Date('2024-01-15'),
      endTime: '12:00',
      schedulingConsiderations: null,
      commsLeadId: null,
      newsReleaseId: null,
      eventLeadOrgId: null,
      venueAddress: null,
      eventLeadId: null,
      eventLeadName: null,
      graphicsId: null,
      notForLookAhead: false,
      lookAheadStatus: 'none',
      lookAheadSection: 'events',
      planningReport: false,
      thirtySixtyNinetyReport: false,
      ownerId: null,
      calendarVisibility: 'visible',
      createdDateTime: now,
      createdBy: 1,
      lastUpdatedDateTime: now,
      lastUpdatedBy: 1,
      rowVersion: 0,
      rowGuid: null,
      // Additional fields that might exist
      contactMinistryId: null,
      cityId: null,
      hqSection: 0,
      ...overrides,
    } as Activity;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: ActivitiesGateway,
          useValue: mockActivitiesGateway,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);

    // Setup related data mocks after service is created
    setupRelatedDataMocks();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('mapToResponseDto validation', () => {
    it('should map a minimal activity to a valid ActivityResponse', async () => {
      const mockActivity = createMockActivity();
      const mockDbQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockActivity]),
      };

      mockDatabaseService.db.select = jest.fn().mockReturnValue(mockDbQuery);

      const result = await service.findOne(1);

      // Verify the result matches the schema
      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test Activity');
    });

    it('should map an activity with all optional fields to a valid ActivityResponse', async () => {
      const mockActivity = createMockActivity({
        displayId: 'MIN-000123',
        summary: 'A detailed summary',
        isIssue: true,
        oicRelated: true,
        leadOrgId: '123e4567-e89b-12d3-a456-426614174000',
        significance: 'High significance',
        pitchComments: 'Some pitch comments',
        isConfidential: true,
        schedulingConsiderations: 'Consider scheduling',
        commsLeadId: 2,
        newsReleaseId: '123e4567-e89b-12d3-a456-426614174001',
        eventLeadOrgId: '123e4567-e89b-12d3-a456-426614174002',
        venueAddress: {
          street: '123 Main St',
          city: 'Victoria',
          provinceOrState: 'BC',
          country: 'Canada',
        },
        eventLeadId: 3,
        graphicsId: 5,
        notForLookAhead: true,
        lookAheadStatus: 'new',
        lookAheadSection: 'issues',
        planningReport: true,
        thirtySixtyNinetyReport: true,
        ownerId: 6,
        calendarVisibility: 'partial',
        startDate: new Date('2024-02-20') as any,
        startTime: '14:30',
        endDate: new Date('2024-02-20') as any,
        endTime: '16:45',
      } as Partial<Activity>);

      const mockDbQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockActivity]),
      };

      mockDatabaseService.db.select = jest.fn().mockReturnValue(mockDbQuery);

      const result = await service.findOne(1);

      // Verify the result matches the schema
      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.displayId).toBe('MIN-000123');
      expect(result.summary).toBe('A detailed summary');
      expect(result.isIssue).toBe(true);
      expect(result.venueAddress).toEqual({
        street: '123 Main St',
        city: 'Victoria',
        provinceOrState: 'BC',
        country: 'Canada',
      });
    });

    it('should map an activity with null dates to valid ActivityResponse', async () => {
      const mockActivity = createMockActivity({
        startDate: null,
        startTime: null,
        endDate: null,
        endTime: null,
      });

      const mockDbQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockActivity]),
      };

      mockDatabaseService.db.select = jest.fn().mockReturnValue(mockDbQuery);

      const result = await service.findOne(1);

      // Verify the result matches the schema
      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.startDate).toBeNull();
      expect(result.startTime).toBeNull();
      expect(result.endDate).toBeNull();
      expect(result.endTime).toBeNull();
    });

    it('should map an activity with eventLeadName instead of eventLeadId', async () => {
      const mockActivity = createMockActivity({
        eventLeadId: null,
        eventLeadName: 'External Event Lead',
      });

      const mockDbQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockActivity]),
      };

      mockDatabaseService.db.select = jest.fn().mockReturnValue(mockDbQuery);

      const result = await service.findOne(1);

      // Verify the result matches the schema
      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.eventLead).toBe('External Event Lead');
      expect(result.eventLeadName).toBe('External Event Lead');
    });

    it('should format dates correctly in ActivityResponse', async () => {
      const mockActivity = createMockActivity({
        startDate: new Date('2024-03-15T10:30:00Z') as any,
        endDate: new Date('2024-03-15T14:45:00Z') as any,
        startTime: '10:30:00',
        endTime: '14:45:00',
      } as Partial<Activity>);

      const mockDbQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockActivity]),
      };

      mockDatabaseService.db.select = jest.fn().mockReturnValue(mockDbQuery);

      const result = await service.findOne(1);

      // Verify the result matches the schema
      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.startDate).toBe('2024-03-15');
      expect(result.endDate).toBe('2024-03-15');
      expect(result.startTime).toBe('10:30');
      expect(result.endTime).toBe('14:45');
    });

    it('should handle time strings that are already in HH:mm format', async () => {
      const mockActivity = createMockActivity({
        startTime: '09:00',
        endTime: '17:00',
      });

      const mockDbQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockActivity]),
      };

      mockDatabaseService.db.select = jest.fn().mockReturnValue(mockDbQuery);

      const result = await service.findOne(1);

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.startTime).toBe('09:00');
      expect(result.endTime).toBe('17:00');
    });

    it('should ensure all required fields are present in ActivityResponse', async () => {
      const mockActivity = createMockActivity();
      const mockDbQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockActivity]),
      };

      mockDatabaseService.db.select = jest.fn().mockReturnValue(mockDbQuery);

      const result = await service.findOne(1);

      // Verify all required fields from schema are present
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('activityStatusId');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('isIssue');
      expect(result).toHaveProperty('oicRelated');
      expect(result).toHaveProperty('isActive');
      expect(result).toHaveProperty('pitchStatus');
      expect(result).toHaveProperty('confidential');
      expect(result).toHaveProperty('schedulingStatus');
      expect(result).toHaveProperty('isAllDay');
      expect(result).toHaveProperty('notForLookAhead');
      expect(result).toHaveProperty('lookAheadStatus');
      expect(result).toHaveProperty('lookAheadSection');
      expect(result).toHaveProperty('planningReport');
      expect(result).toHaveProperty('thirtySixtyNinetyReport');
      expect(result).toHaveProperty('calendarVisibility');
      expect(result).toHaveProperty('createdDateTime');
      expect(result).toHaveProperty('createdBy');
      expect(result).toHaveProperty('lastUpdatedDateTime');
      expect(result).toHaveProperty('lastUpdatedBy');
    });

    it('should ensure enum fields match schema constraints', async () => {
      const testCases = [
        {
          lookAheadStatus: 'none' as const,
          lookAheadSection: 'events' as const,
          calendarVisibility: 'visible' as const,
        },
        {
          lookAheadStatus: 'new' as const,
          lookAheadSection: 'issues' as const,
          calendarVisibility: 'partial' as const,
        },
        {
          lookAheadStatus: 'changed' as const,
          lookAheadSection: 'news' as const,
          calendarVisibility: 'hidden' as const,
        },
        {
          lookAheadStatus: 'none' as const,
          lookAheadSection: 'awareness' as const,
          calendarVisibility: 'visible' as const,
        },
      ];

      for (const testCase of testCases) {
        const mockActivity = createMockActivity(testCase);
        const mockDbQuery = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([mockActivity]),
        };

        mockDatabaseService.db.select = jest.fn().mockReturnValue(mockDbQuery);

        const result = await service.findOne(1);

        expect(() => activityResponseSchema.parse(result)).not.toThrow();
        expect(result.lookAheadStatus).toBe(testCase.lookAheadStatus);
        expect(result.lookAheadSection).toBe(testCase.lookAheadSection);
        expect(result.calendarVisibility).toBe(testCase.calendarVisibility);
      }
    });

    it('should ensure date/time fields are ISO strings', async () => {
      const now = new Date();
      const mockActivity = createMockActivity({
        createdDateTime: now,
        lastUpdatedDateTime: now,
      });

      const mockDbQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockActivity]),
      };

      mockDatabaseService.db.select = jest.fn().mockReturnValue(mockDbQuery);

      const result = await service.findOne(1);

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      // Verify ISO datetime format
      expect(result.createdDateTime).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
      expect(result.lastUpdatedDateTime).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when activity does not exist', async () => {
      const mockDbQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      mockDatabaseService.db.select = jest.fn().mockReturnValue(mockDbQuery);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create an activity and return a valid ActivityResponse', async () => {
      const createDto = {
        title: 'New Activity',
        isActive: true,
        isIssue: false,
        oicRelated: false,
        isAllDay: false,
        isConfidential: false,
        notForLookAhead: false,
        planningReport: false,
        thirtySixtyNinetyReport: false,
      } as unknown as CreateActivityRequest;

      const createdActivity = createMockActivity({
        ...createDto,
        id: 2,
        title: 'New Activity',
      });

      // Mock the transaction
      mockDatabaseService.db.transaction = jest
        .fn()
        .mockImplementation((callback) => {
          // Create a mock transaction context
          const mockTx = {
            insert: jest.fn().mockReturnValue({
              values: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([createdActivity]),
              }),
            }),
            delete: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockResolvedValue([]),
          };
          return callback(mockTx);
        });

      // Mock findOne to return the created activity
      const mockSelectQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([createdActivity]),
      };
      mockDatabaseService.db.select = jest
        .fn()
        .mockReturnValue(mockSelectQuery);

      const result = await service.create(createDto);

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.id).toBe(2);
      expect(result.title).toBe('New Activity');
      expect(mockActivitiesGateway.broadcastActivityCreated).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an activity and return a valid ActivityResponse', async () => {
      const existingActivity = createMockActivity({ id: 1 });
      const updatedActivity = createMockActivity({
        id: 1,
        title: 'Updated Activity',
      });

      // Mock findOne (to check existence)
      const mockSelectQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([existingActivity]),
      };

      // Mock update
      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([updatedActivity]),
      };

      mockDatabaseService.db.select = jest
        .fn()
        .mockReturnValue(mockSelectQuery);
      mockDatabaseService.db.update = jest.fn().mockReturnValue(mockUpdate);

      const updateDto = {
        title: 'Updated Activity',
      } as unknown as UpdateActivityRequest;
      const result = await service.update(1, updateDto);

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.title).toBe('Updated Activity');
    });
  });
});
