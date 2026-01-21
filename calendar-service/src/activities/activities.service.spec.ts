import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './services/activities.service';
import { DatabaseService } from '../database/database.service';
import { ActivitiesGateway } from './activities.gateway';
import { ActivityHistoryService } from './services/activity-history.service';
import { ActivityJunctionService } from './services/activity-junction.service';
import { ActivityDataFetcherService } from './services/activity-data-fetcher.service';
import { ActivityMapperService } from './services/activity-mapper.service';
import { ActivityUtilsService } from './services/activity-utils.service';
import { activityResponseSchema } from '@corpcal/shared/schemas';
import type { Activity } from '@corpcal/database/types';
import type {
  LookAheadStatus,
  LookAheadSection,
  Visibility,
} from '@corpcal/shared';
import { NotFoundException } from '@nestjs/common';
import {
  createMockActivityRequest,
  createMockUpdateRequest,
  createMockActivity,
} from '../common/test-utils';

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  // Helper to create a mock query chain that supports all methods
  const createMockQueryChain = (finalValue: any) => {
    const chain = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(finalValue),
      offset: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };
    // innerJoin and leftJoin return a chain where where() resolves to finalValue
    const joinChain = {
      ...chain,
      where: jest.fn().mockResolvedValue(finalValue),
    };
    chain.innerJoin.mockReturnValue(joinChain);
    chain.leftJoin.mockReturnValue(joinChain);
    return chain;
  };

  // Helper to create a mock select function that handles both main queries and fetch methods
  const createMockSelect = (mainQueryResult: any) => {
    return jest.fn((...args) => {
      if (args.length === 0) {
        // Main query: select().from().where().limit()
        return createMockQueryChain(mainQueryResult);
      }
      // For fetch methods (select with object), where() should return a promise
      const fetchChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
        leftJoin: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      const joinChain = {
        ...fetchChain,
        where: jest.fn().mockResolvedValue([]),
      };
      fetchChain.innerJoin.mockReturnValue(joinChain);
      fetchChain.leftJoin.mockReturnValue(joinChain);
      return fetchChain;
    });
  };

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

  // Mock activity history service
  const mockActivityHistoryService = {
    recordChange: jest.fn().mockResolvedValue(undefined),
    getActivityHistory: jest.fn().mockResolvedValue([]),
    getLastPublishedState: jest.fn().mockResolvedValue(null),
    generateChangeList: jest.fn().mockReturnValue([]),
  };

  // Mock junction service
  const mockJunctionService = {
    insertJunctionRecords: jest.fn().mockResolvedValue(undefined),
    updateJunctionRecords: jest.fn().mockResolvedValue(undefined),
    insertRepresentatives: jest.fn().mockResolvedValue(undefined),
    updateRepresentatives: jest.fn().mockResolvedValue(undefined),
    insertVenueAddress: jest.fn().mockResolvedValue(undefined),
    upsertVenueAddress: jest.fn().mockResolvedValue(undefined),
    createDefaultReportSettings: jest.fn().mockResolvedValue(undefined),
    updateActivityReportSettings: jest.fn().mockResolvedValue(undefined),
    insertCommsContacts: jest.fn().mockResolvedValue(undefined),
    updateCommsContacts: jest.fn().mockResolvedValue(undefined),
  };

  // Mock data fetcher service
  const mockDataFetcherService = {
    fetchCategoriesForActivities: jest
      .fn()
      .mockResolvedValue({ namesMap: new Map(), idsMap: new Map() }),
    fetchTagsForActivities: jest.fn().mockResolvedValue(new Map()),
    fetchActivityStatusesForActivities: jest.fn().mockResolvedValue(new Map()),
    fetchPitchStatusesForActivities: jest.fn().mockResolvedValue(new Map()),
    fetchDateStatusesForActivities: jest.fn().mockResolvedValue(new Map()),
    fetchTimeStatusesForActivities: jest.fn().mockResolvedValue(new Map()),
    fetchVenueStatusesForActivities: jest.fn().mockResolvedValue(new Map()),
    fetchVenueAddressesForActivities: jest.fn().mockResolvedValue(new Map()),
    fetchCommsMaterialsForActivities: jest.fn().mockResolvedValue(new Map()),
    fetchTranslationsRequiredForActivities: jest
      .fn()
      .mockResolvedValue(new Map()),
    fetchRepresentativesAttendingForActivities: jest
      .fn()
      .mockResolvedValue(new Map()),
    fetchSharedWithTeamsForActivities: jest.fn().mockResolvedValue(new Map()),
    fetchCommsContactsForActivities: jest.fn().mockResolvedValue(new Map()),
    fetchLeadOrgNamesForActivities: jest.fn().mockResolvedValue(new Map()),
    fetchEventLeadOrgNamesForActivities: jest.fn().mockResolvedValue(new Map()),
    fetchEventPlannerNamesForActivities: jest.fn().mockResolvedValue(new Map()),
    fetchNewsReleaseOriginsForActivities: jest
      .fn()
      .mockResolvedValue(new Map()),
    fetchNewsReleaseDistributionsForActivities: jest
      .fn()
      .mockResolvedValue(new Map()),
    fetchPremierRequestedForActivities: jest.fn().mockResolvedValue(new Map()),
    fetchReportSettingsForActivities: jest.fn().mockResolvedValue(new Map()),
  };

  // Mock mapper service
  const mockMapperService = {
    mapToResponseDto: jest.fn((activity, relatedData) => {
      // Format time to HH:mm (matches real mapper behavior)
      const formatTime = (time: string | null): string | null => {
        if (!time) return null;
        // If it's already in HH:mm format, return as is
        if (time.match(/^\d{2}:\d{2}$/)) return time;
        // If it's a full time string, extract HH:mm
        return time.substring(0, 5);
      };

      // Return a minimal valid response for testing
      return {
        id: activity.id,
        displayId: activity.displayId ?? null,
        activityStatusId: activity.activityStatusId ?? 0,
        dateStatusId: activity.dateStatusId ?? 0,
        timeStatusId: activity.timeStatusId ?? 0,
        category: relatedData?.categories ?? [],
        title: activity.title ?? '',
        summary: activity.summary ?? '',
        isIssue: activity.isIssue ?? false,
        isConfidential: activity.isConfidential ?? false,
        leadOrgId: activity.leadOrgId ?? null,
        leadOrgName: activity.leadOrgName ?? null,
        leadOrg: relatedData?.leadOrgName ?? null,
        tags: relatedData?.tags ?? [],
        significance: activity.significance ?? '',
        activityStatus: relatedData?.activityStatus ?? 'unknown',
        dateStatus: relatedData?.dateStatus ?? 'unknown',
        timeStatus: relatedData?.timeStatus ?? 'unknown',
        isAllDay: activity.isAllDay ?? false,
        startDate: activity.startDate
          ? new Date(activity.startDate as string | number | Date)
              .toISOString()
              .split('T')[0]
          : null,
        startTime: formatTime(activity.startTime as string | null),
        endDate: activity.endDate
          ? new Date(activity.endDate as string | number | Date)
              .toISOString()
              .split('T')[0]
          : null,
        endTime: formatTime(activity.endTime as string | null),
        schedulingNotes: activity.schedulingNotes ?? null,
        commsMaterials: relatedData?.commsMaterials ?? [],
        newsReleaseId: activity.newsReleaseId ?? null,
        newsReleaseOriginId: activity.newsReleaseOriginId ?? null,
        newsReleaseDistributionId: activity.newsReleaseDistributionId ?? null,
        translationsRequired: relatedData?.translationsRequired ?? [],
        representativesAttending: relatedData?.representativesAttending ?? [],
        venueAddress: relatedData?.venueAddress ?? null,
        eventPlannerLeadId: activity.eventPlannerLeadId ?? null,
        eventLead:
          activity.eventPlannerLeadName ?? relatedData?.eventLeadName ?? null,
        eventPlannerLeadName: activity.eventPlannerLeadName ?? null,
        reportSettings: [],
        executiveSummary: activity.executiveSummary ?? null,
        lookAheadStatus:
          activity.lookAheadStatus ?? ('none' satisfies LookAheadStatus),
        lookAheadSection:
          activity.lookAheadSection ?? ('events' satisfies LookAheadSection),
        notes: activity.notes ?? null,
        pitchDate: activity.pitchDate
          ? new Date(activity.pitchDate as string | number | Date)
              .toISOString()
              .split('T')[0]
          : null,
        premierRequestedId: activity.premierRequestedId ?? null,
        visibility: activity.visibility ?? ('global' satisfies Visibility),
        sharedWithAll: activity.sharedWithAll ?? false,
        leadMinistryId: activity.leadMinistryId,
        sharedWith: relatedData?.sharedWith ?? [],
        commsContacts: relatedData?.commsContacts ?? [],
        newsReleaseOrigin: relatedData?.newsReleaseOrigin ?? null,
        newsReleaseDistribution: relatedData?.newsReleaseDistribution ?? null,
        premierRequested: relatedData?.premierRequested ?? null,
        createdDateTime:
          activity.createdDateTime?.toISOString() ?? new Date().toISOString(),
        createdBy: activity.createdBy ?? 0,
        lastUpdatedDateTime:
          activity.lastUpdatedDateTime?.toISOString() ??
          activity.createdDateTime?.toISOString() ??
          new Date().toISOString(),
        lastUpdatedBy: activity.lastUpdatedBy ?? 0,
      };
    }),
  };

  // Mock utils service
  const mockUtilsService = {
    generateDisplayId: jest.fn(
      (abbrev, id) =>
        `${abbrev.toUpperCase()}-${id.toString().slice(-6).padStart(6, '0')}`
    ),
    validateCategoryIds: jest.fn().mockResolvedValue(undefined),
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
        {
          provide: ActivityHistoryService,
          useValue: mockActivityHistoryService,
        },
        {
          provide: ActivityJunctionService,
          useValue: mockJunctionService,
        },
        {
          provide: ActivityDataFetcherService,
          useValue: mockDataFetcherService,
        },
        {
          provide: ActivityMapperService,
          useValue: mockMapperService,
        },
        {
          provide: ActivityUtilsService,
          useValue: mockUtilsService,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('mapToResponseDto validation', () => {
    it('should map a minimal activity to a valid ActivityResponse', async () => {
      const mockActivity = createMockActivity();
      mockDatabaseService.db.select = createMockSelect([mockActivity]);

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
        leadOrgId: '123e4567-e89b-12d3-a456-426614174000',
        leadOrgName: 'Test Organization',
        significance: 'High significance',
        notes: 'Some notes',
        pitchDate: new Date('2024-02-15') as any,
        schedulingNotes: 'Consider scheduling',
        newsReleaseId: '123e4567-e89b-12d3-a456-426614174001',
        newsReleaseDistributionId: 1,
        premierRequestedId: 2,
        eventPlannerLeadId: 3,
        reportSettings: [
          { reportId: 1, omitted: true },
          { reportId: 2, omitted: true },
        ],
        sharedWithAll: true,
        lookAheadStatus: 'new',
        lookAheadSection: 'issues',
        commsContactLeadId: 6,
        leadMinistryId: '123e4567-e89b-12d3-a456-426614174003',
        startDate: new Date('2024-02-20') as any,
        startTime: '14:30',
        endDate: new Date('2024-02-20') as any,
        endTime: '16:45',
      } as Partial<Activity>);

      mockDatabaseService.db.select = createMockSelect([mockActivity]);

      const result = await service.findOne(1);

      // Verify the result matches the schema
      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.displayId).toBe('MIN-000123');
      expect(result.summary).toBe('A detailed summary');
      expect(result.isIssue).toBe(true);
      // venueAddress is fetched from a separate table, so it will be null in this test
      // unless we mock the venue address fetch separately
      expect(result.venueAddress).toBeNull();
    });

    it('should map an activity with null dates to valid ActivityResponse', async () => {
      const mockActivity = createMockActivity({
        startDate: null,
        startTime: null,
        endDate: null,
        endTime: null,
      });

      mockDatabaseService.db.select = createMockSelect([mockActivity]);

      const result = await service.findOne(1);

      // Verify the result matches the schema
      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.startDate).toBeNull();
      expect(result.startTime).toBeNull();
      expect(result.endDate).toBeNull();
      expect(result.endTime).toBeNull();
    });

    it('should map an activity with eventPlannerLeadName instead of eventPlannerLeadId', async () => {
      const mockActivity = createMockActivity({
        eventPlannerLeadId: null,
        eventPlannerLeadName: 'External Event Lead',
      });

      mockDatabaseService.db.select = createMockSelect([mockActivity]);

      const result = await service.findOne(1);

      // Verify the result matches the schema
      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.eventLead).toBe('External Event Lead');
      expect(result.eventPlannerLeadName).toBe('External Event Lead');
    });

    it('should format dates correctly in ActivityResponse', async () => {
      const mockActivity = createMockActivity({
        startDate: new Date('2024-03-15T10:30:00Z') as any,
        endDate: new Date('2024-03-15T14:45:00Z') as any,
        startTime: '10:30:00',
        endTime: '14:45:00',
      } as Partial<Activity>);

      mockDatabaseService.db.select = createMockSelect([mockActivity]);

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

      mockDatabaseService.db.select = createMockSelect([mockActivity]);

      const result = await service.findOne(1);

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.startTime).toBe('09:00');
      expect(result.endTime).toBe('17:00');
    });

    it('should ensure all required fields are present in ActivityResponse', async () => {
      const mockActivity = createMockActivity();
      mockDatabaseService.db.select = createMockSelect([mockActivity]);

      const result = await service.findOne(1);

      // Verify all required fields from schema are present
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('activityStatusId');
      expect(result).toHaveProperty('activityStatus');
      expect(result).toHaveProperty('dateStatusId');
      expect(result).toHaveProperty('timeStatusId');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('isIssue');
      expect(result).toHaveProperty('isAllDay');
      expect(result).toHaveProperty('reportSettings');
      expect(Array.isArray(result.reportSettings)).toBe(true);
      expect(result).toHaveProperty('sharedWithAll');
      expect(result).toHaveProperty('lookAheadStatus');
      expect(result).toHaveProperty('lookAheadSection');
      expect(result).toHaveProperty('commsContactLeadId');
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
        },
        {
          lookAheadStatus: 'new' as const,
          lookAheadSection: 'issues' as const,
        },
        {
          lookAheadStatus: 'changed' as const,
          lookAheadSection: 'news' as const,
        },
        {
          lookAheadStatus: 'none' as const,
          lookAheadSection: 'awareness' as const,
        },
      ];

      for (const testCase of testCases) {
        const mockActivity = createMockActivity(testCase);
        mockDatabaseService.db.select = createMockSelect([mockActivity]);

        const result = await service.findOne(1);

        expect(() => activityResponseSchema.parse(result)).not.toThrow();
        expect(result.lookAheadStatus).toBe(testCase.lookAheadStatus);
        expect(result.lookAheadSection).toBe(testCase.lookAheadSection);
      }
    });

    it('should ensure date/time fields are ISO strings', async () => {
      const now = new Date();
      const mockActivity = createMockActivity({
        createdDateTime: now,
        lastUpdatedDateTime: now,
      });

      mockDatabaseService.db.select = createMockSelect([mockActivity]);

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
      mockDatabaseService.db.select = createMockSelect([]);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create an activity and return a valid ActivityResponse', async () => {
      const createDto = createMockActivityRequest({
        title: 'New Activity',
        isIssue: false,
        isAllDay: false,
        reportSettings: [],
      });

      const createdActivity = createMockActivity({
        id: 2,
        title: 'New Activity',
        isIssue: false,
        isAllDay: false,
      });

      const mockInsert = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([createdActivity]),
      };

      // Mock transaction to execute the callback and return the result
      mockDatabaseService.db.transaction = jest.fn(async (callback) => {
        const ministryQuery = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([{ abbreviation: 'MIN' }]),
        };
        const tx = {
          insert: jest.fn().mockReturnValue(mockInsert),
          select: jest.fn((...args) => {
            // Ministry lookup uses select({ abbreviation: ... })
            if (args.length > 0 && typeof args[0] === 'object') {
              return ministryQuery;
            }
            return createMockQueryChain([createdActivity]);
          }),
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([createdActivity]),
          }),
        };
        return await callback(tx);
      });

      mockDatabaseService.db.insert = jest.fn().mockReturnValue(mockInsert);

      // Mock select for findOne call after create
      mockDatabaseService.db.select = createMockSelect([createdActivity]);

      const result = await service.create(createDto);

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.id).toBe(2);
      expect(result.title).toBe('New Activity');
    });
  });

  describe('update', () => {
    it('should update an activity and return a valid ActivityResponse', async () => {
      const existingActivity = createMockActivity({ id: 1 });
      const updatedActivity = createMockActivity({
        id: 1,
        title: 'Updated Activity',
      });

      // Mock transaction for update
      mockDatabaseService.db.transaction = jest.fn(async (callback) => {
        const tx = {
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([updatedActivity]),
          }),
          select: jest.fn((...args) => {
            // For venue address check in transaction
            if (args.length === 0) {
              return createMockQueryChain([]);
            }
            // For fetch methods
            const fetchChain = {
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockResolvedValue([]),
              leftJoin: jest.fn().mockReturnThis(),
              innerJoin: jest.fn().mockReturnThis(),
              limit: jest.fn().mockResolvedValue([]),
            };
            const joinChain = {
              ...fetchChain,
              where: jest.fn().mockResolvedValue([]),
            };
            fetchChain.innerJoin.mockReturnValue(joinChain);
            fetchChain.leftJoin.mockReturnValue(joinChain);
            return fetchChain;
          }),
          delete: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined),
          }),
        };
        return await callback(tx);
      });

      // Mock select: first call returns existing activity (for existence check),
      // subsequent calls return updated activity (for findOne after update)
      let selectCallCount = 0;
      mockDatabaseService.db.select = jest.fn((...args) => {
        if (args.length === 0) {
          selectCallCount++;
          if (selectCallCount === 1) {
            // First call: check existence (before update)
            return createMockQueryChain([existingActivity]);
          } else {
            // Subsequent calls: return updated activity (after update)
            return createMockQueryChain([updatedActivity]);
          }
        }
        // For fetch methods (select with object), use the helper pattern
        const fetchChain = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([]),
          leftJoin: jest.fn().mockReturnThis(),
          innerJoin: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([]),
        };
        const joinChain = {
          ...fetchChain,
          where: jest.fn().mockResolvedValue([]),
        };
        fetchChain.innerJoin.mockReturnValue(joinChain);
        fetchChain.leftJoin.mockReturnValue(joinChain);
        return fetchChain;
      });

      const updateDto = createMockUpdateRequest({
        title: 'Updated Activity',
      });
      const result = await service.update(1, updateDto);

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.title).toBe('Updated Activity');
    });
  });
});
