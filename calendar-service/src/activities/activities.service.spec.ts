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
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(finalValue),
      offset: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
    };
    // innerJoin and leftJoin return a chain where where() resolves to finalValue
    const joinChain = {
      ...chain,
      where: vi.fn().mockResolvedValue(finalValue),
    };
    chain.innerJoin.mockReturnValue(joinChain);
    chain.leftJoin.mockReturnValue(joinChain);
    return chain;
  };

  // Helper to create a mock select function that handles both main queries and fetch methods
  const createMockSelect = (mainQueryResult: any) => {
    return vi.fn((...args) => {
      if (args.length === 0) {
        // Main query: select().from().where().limit()
        return createMockQueryChain(mainQueryResult);
      }
      // For fetch methods (select with object), where() should return a promise
      const fetchChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
        leftJoin: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      const joinChain = {
        ...fetchChain,
        where: vi.fn().mockResolvedValue([]),
      };
      fetchChain.innerJoin.mockReturnValue(joinChain);
      fetchChain.leftJoin.mockReturnValue(joinChain);
      return fetchChain;
    });
  };

  // Mock database service
  const mockDatabaseService = {
    db: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      transaction: vi.fn(),
    },
  };

  // Mock activities gateway
  const mockActivitiesGateway = {
    notifyActivityUpdate: vi.fn(),
    broadcastActivityCreated: vi.fn(),
    server: {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    },
  };

  // Mock activity history service
  const mockActivityHistoryService = {
    recordChange: vi.fn().mockResolvedValue(undefined),
    getActivityHistory: vi.fn().mockResolvedValue([]),
    getLastPublishedState: vi.fn().mockResolvedValue(null),
    generateChangeList: vi.fn().mockReturnValue([]),
  };

  // Mock junction service
  const mockJunctionService = {
    insertJunctionRecords: vi.fn().mockResolvedValue(undefined),
    updateJunctionRecords: vi.fn().mockResolvedValue(undefined),
    insertRepresentatives: vi.fn().mockResolvedValue(undefined),
    updateRepresentatives: vi.fn().mockResolvedValue(undefined),
    insertVenueAddress: vi.fn().mockResolvedValue(undefined),
    upsertVenueAddress: vi.fn().mockResolvedValue(undefined),
    createDefaultReportSettings: vi.fn().mockResolvedValue(undefined),
    updateActivityReportSettings: vi.fn().mockResolvedValue(undefined),
    insertCommsContacts: vi.fn().mockResolvedValue(undefined),
    updateCommsContacts: vi.fn().mockResolvedValue(undefined),
  };

  // Mock data fetcher service
  const mockDataFetcherService = {
    fetchCategoriesForActivities: vi
      .fn()
      .mockResolvedValue({ namesMap: new Map(), idsMap: new Map() }),
    fetchTagsForActivities: vi.fn().mockResolvedValue(new Map()),
    fetchActivityStatusesForActivities: vi.fn().mockResolvedValue(new Map()),
    fetchPitchStatusesForActivities: vi.fn().mockResolvedValue(new Map()),
    fetchDateStatusesForActivities: vi.fn().mockResolvedValue(new Map()),
    fetchTimeStatusesForActivities: vi.fn().mockResolvedValue(new Map()),
    fetchVenueStatusesForActivities: vi.fn().mockResolvedValue(new Map()),
    fetchVenueAddressesForActivities: vi.fn().mockResolvedValue(new Map()),
    fetchCommsMaterialsForActivities: vi.fn().mockResolvedValue(new Map()),
    fetchTranslationsRequiredForActivities: vi
      .fn()
      .mockResolvedValue(new Map()),
    fetchRepresentativesAttendingForActivities: vi
      .fn()
      .mockResolvedValue(new Map()),
    fetchSharedWithTeamsForActivities: vi.fn().mockResolvedValue(new Map()),
    fetchCommsContactsForActivities: vi.fn().mockResolvedValue(new Map()),
    fetchLeadOrgNamesForActivities: vi.fn().mockResolvedValue(new Map()),
    fetchEventLeadOrgNamesForActivities: vi.fn().mockResolvedValue(new Map()),
    fetchEventPlannerNamesForActivities: vi.fn().mockResolvedValue(new Map()),
    fetchNewsReleaseOriginsForActivities: vi.fn().mockResolvedValue(new Map()),
    fetchNewsReleaseDistributionsForActivities: vi
      .fn()
      .mockResolvedValue(new Map()),
    fetchPremierRequestedForActivities: vi.fn().mockResolvedValue(new Map()),
    fetchReportSettingsForActivities: vi.fn().mockResolvedValue(new Map()),
  };

  // Mock mapper service
  const mockMapperService = {
    mapToResponseDto: vi.fn((activity, relatedData) => {
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
        pitchRequired: activity.pitchRequired ?? null,
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
    generateDisplayId: vi.fn(
      (abbrev, id) =>
        `${abbrev.toUpperCase()}-${id.toString().slice(-6).padStart(6, '0')}`
    ),
    validateCategoryIds: vi.fn().mockResolvedValue(undefined),
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
    vi.clearAllMocks();
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
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([createdActivity]),
      };

      // Mock transaction to execute the callback and return the result
      mockDatabaseService.db.transaction = vi.fn(async (callback) => {
        const ministryQuery = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ abbreviation: 'MIN' }]),
        };
        const tx = {
          insert: vi.fn().mockReturnValue(mockInsert),
          select: vi.fn((...args) => {
            // Ministry lookup uses select({ abbreviation: ... })
            if (args.length > 0 && typeof args[0] === 'object') {
              return ministryQuery;
            }
            return createMockQueryChain([createdActivity]);
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([createdActivity]),
          }),
        };
        return await callback(tx);
      });

      mockDatabaseService.db.insert = vi.fn().mockReturnValue(mockInsert);

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
      mockDatabaseService.db.transaction = vi.fn(async (callback) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([updatedActivity]),
          }),
          select: vi.fn((...args) => {
            // For venue address check in transaction
            if (args.length === 0) {
              return createMockQueryChain([]);
            }
            // For fetch methods
            const fetchChain = {
              from: vi.fn().mockReturnThis(),
              where: vi.fn().mockResolvedValue([]),
              leftJoin: vi.fn().mockReturnThis(),
              innerJoin: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue([]),
            };
            const joinChain = {
              ...fetchChain,
              where: vi.fn().mockResolvedValue([]),
            };
            fetchChain.innerJoin.mockReturnValue(joinChain);
            fetchChain.leftJoin.mockReturnValue(joinChain);
            return fetchChain;
          }),
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        };
        return await callback(tx);
      });

      // Mock select: first call returns existing activity (for existence check),
      // subsequent calls return updated activity (for findOne after update)
      let selectCallCount = 0;
      mockDatabaseService.db.select = vi.fn((...args) => {
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
          from: vi.fn()().mockReturnThis(),
          where: vi.fn()().mockResolvedValue([]),
          leftJoin: vi.fn()().mockReturnThis(),
          innerJoin: vi.fn()().mockReturnThis(),
          limit: vi.fn()().mockResolvedValue([]),
        };
        const joinChain = {
          ...fetchChain,
          where: vi.fn()().mockResolvedValue([]),
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
