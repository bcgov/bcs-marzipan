import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import type { Activity } from '@corpcal/database/types';
import { PERMISSIONS } from '@corpcal/shared';
import {
  activityResponseSchema,
  type UpdateActivityRequest,
} from '@corpcal/shared/schemas';

import {
  createMockActivity,
  createMockActivityRequest,
  createMockUpdateRequest,
} from '../common/test-utils';
import { DatabaseService } from '../database/database.service';
import { LocksService } from '../locks/locks.service';
import { PolicyService } from '../policy/policy.service';
import { TeamsService } from '../teams/teams.service';
import { ActivitiesGateway } from './activities.gateway';
import { ActivitiesService } from './services/activities.service';
import { ActivityDataFetcherService } from './services/activity-data-fetcher.service';
import { createMockActivityDataFetcherService } from './services/activity-data-fetcher.service.mock';
import { ActivityHistoryService } from './services/activity-history.service';
import { ActivityJunctionService } from './services/activity-junction.service';
import { ActivityMapperService } from './services/activity-mapper.service';
import { ActivityUtilsService } from './services/activity-utils.service';

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
    getHistoryEntryById: vi.fn().mockResolvedValue(null),
    getLastPublishedState: vi.fn().mockResolvedValue(null),
    getPreviousStatusIdBeforeDelete: vi.fn().mockResolvedValue(null),
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
    insertEventPlanners: vi.fn().mockResolvedValue(undefined),
    updateEventPlanners: vi.fn().mockResolvedValue(undefined),
  };

  // Mock data fetcher service (from shared factory to stay in sync with ActivityDataFetcherService)
  const mockDataFetcherService = createMockActivityDataFetcherService();

  // Mock utils service
  const mockUtilsService = {
    generateDisplayId: vi.fn(
      (abbrev, id) =>
        `${String(abbrev).toUpperCase().trim()}-${id.toString().slice(-6).padStart(6, '0')}`
    ),
    getDisplayIdPrefixFromTeamName: vi.fn((name: string) =>
      (name ?? '')
        .trim()
        .replace(/\s+/g, '')
        .slice(0, 4)
        .toUpperCase()
        .padEnd(4, 'X')
    ),
    validateCategoryIds: vi.fn().mockResolvedValue(undefined),
  };

  // Mock locks service (added when ActivitiesService started using LocksService)
  const mockLocksService = {
    getLockForEntity: vi.fn().mockResolvedValue(null),
    releaseLock: vi.fn().mockResolvedValue(undefined),
    tryAcquireLock: vi.fn().mockResolvedValue({}),
  };

  // Mock policy service (for delete context: comms/lead-team when no delete.any)
  const mockPolicyService = {
    isCommsContactForActivity: vi.fn().mockResolvedValue(false),
    getLeadTeamIdForActivity: vi.fn().mockResolvedValue(null),
  };

  // Mock teams service (for comms contact validation)
  const mockTeamsService = {
    getEligibleCommsUserIds: vi.fn().mockResolvedValue(new Set([1])),
    findCommsContactCandidates: vi.fn().mockResolvedValue([]),
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
        ActivityMapperService,
        {
          provide: ActivityUtilsService,
          useValue: mockUtilsService,
        },
        {
          provide: LocksService,
          useValue: mockLocksService,
        },
        {
          provide: PolicyService,
          useValue: mockPolicyService,
        },
        {
          provide: TeamsService,
          useValue: mockTeamsService,
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

    it('should include leadMinistryAbbreviation from data fetcher in ActivityResponse', async () => {
      const mockActivity = createMockActivity();
      mockDatabaseService.db.select = createMockSelect([mockActivity]);
      mockDataFetcherService.fetchLeadMinistryAbbreviationsForActivities.mockResolvedValue(
        new Map([[1, 'ABC']])
      );

      const result = await service.findOne(1);

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.leadMinistryAbbreviation).toBe('ABC');
    });

    it('should have null leadMinistryAbbreviation when fetcher returns empty Map', async () => {
      const mockActivity = createMockActivity();
      mockDatabaseService.db.select = createMockSelect([mockActivity]);
      mockDataFetcherService.fetchLeadMinistryAbbreviationsForActivities.mockResolvedValue(
        new Map()
      );

      const result = await service.findOne(1);

      expect(result.leadMinistryAbbreviation).toBeNull();
    });

    it('should map an activity with all optional fields to a valid ActivityResponse', async () => {
      const mockActivity = createMockActivity({
        displayId: 'MIN-000123',
        summary: 'A detailed summary',
        isIssue: true,
        leadOrgId: 1,
        leadOrgName: 'Test Organization',
        significance: 'High significance',
        notes: 'Some notes',
        pitchDate: new Date('2024-02-15') as any,
        schedulingNotes: 'Consider scheduling',
        newsReleaseId: '123e4567-e89b-12d3-a456-426614174001',
        newsReleaseDistributionId: 1,
        premierRequestedId: 2,
        eventPlanners: [{ eventPlannerId: 3, isLead: true }],
        reportSettings: [
          { reportId: 1, omitted: true },
          { reportId: 2, omitted: true },
        ],
        lookAheadStatus: 'new',
        lookAheadSection: 'issues',
        leadMinistryId: 1,
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

    it('should map an activity with event planners from junction data', async () => {
      const mockActivity = createMockActivity();

      mockDatabaseService.db.select = createMockSelect([mockActivity]);
      mockDataFetcherService.fetchEventPlannerDetailsForActivities.mockResolvedValue(
        new Map([[1, [{ name: 'External Event Lead', isLead: true }]]])
      );

      const result = await service.findOne(1);

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.eventPlanners).toEqual(['External Event Lead']);
      expect(result.eventPlannerDetails).toEqual([
        { name: 'External Event Lead', isLead: true },
      ]);
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
      expect(result).toHaveProperty('sharedWith');
      expect(Array.isArray(result.sharedWith)).toBe(true);
      expect(result).toHaveProperty('strategy');
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

      // Mock select: team lookup returns team row; status lookup returns status id; findOne returns created activity
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length > 0) {
          const selectArg = args[0];
          if (
            selectArg &&
            typeof selectArg === 'object' &&
            'ministryId' in selectArg &&
            'name' in selectArg
          ) {
            return {
              from: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              limit: vi
                .fn()
                .mockResolvedValue([
                  { id: 1, name: 'Test Team', ministryId: 1 },
                ]),
            };
          }
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ id: 1 }]),
          };
        }
        return createMockQueryChain([createdActivity]);
      });

      const result = await service.create(createDto, 1, {
        roleName: 'Editor',
        permissions: ['activities.create'],
        teamIds: [1],
      });

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.id).toBe(2);
      expect(result.title).toBe('New Activity');
    });

    it('should set initial status to reviewed when user has activities.review and markAsReviewed is true', async () => {
      const createDto = createMockActivityRequest({
        title: 'New Activity',
        isIssue: false,
        isAllDay: false,
        reportSettings: [],
        markAsReviewed: true,
      });

      const createdActivity = createMockActivity({
        id: 2,
        title: 'New Activity',
        isIssue: false,
        isAllDay: false,
        activityStatusId: 2,
      });

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([createdActivity]),
      };

      mockDatabaseService.db.transaction = vi.fn(async (callback) => {
        const ministryQuery = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ abbreviation: 'MIN' }]),
        };
        const tx = {
          insert: vi.fn().mockReturnValue(mockInsert),
          select: vi.fn((...args) => {
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

      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length > 0) {
          const selectArg = args[0];
          if (
            selectArg &&
            typeof selectArg === 'object' &&
            'ministryId' in selectArg &&
            'name' in selectArg
          ) {
            return {
              from: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              limit: vi
                .fn()
                .mockResolvedValue([
                  { id: 1, name: 'Test Team', ministryId: 1 },
                ]),
            };
          }
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ id: 2 }]),
          };
        }
        return createMockQueryChain([createdActivity]);
      });

      const result = await service.create(createDto, 1, {
        roleName: 'Editor',
        permissions: ['activities.create', 'activities.review'],
        teamIds: [1],
      });

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.activityStatusId).toBe(2);
    });

    it('should set initial status to new when user lacks activities.review even if markAsReviewed is true', async () => {
      const createDto = createMockActivityRequest({
        title: 'New Activity',
        isIssue: false,
        isAllDay: false,
        reportSettings: [],
        markAsReviewed: true,
      });

      const createdActivity = createMockActivity({
        id: 2,
        title: 'New Activity',
        isIssue: false,
        isAllDay: false,
        activityStatusId: 1,
      });

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([createdActivity]),
      };

      mockDatabaseService.db.transaction = vi.fn(async (callback) => {
        const ministryQuery = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ abbreviation: 'MIN' }]),
        };
        const tx = {
          insert: vi.fn().mockReturnValue(mockInsert),
          select: vi.fn((...args) => {
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

      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length > 0) {
          const selectArg = args[0];
          if (
            selectArg &&
            typeof selectArg === 'object' &&
            'ministryId' in selectArg &&
            'name' in selectArg
          ) {
            return {
              from: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              limit: vi
                .fn()
                .mockResolvedValue([
                  { id: 1, name: 'Test Team', ministryId: 1 },
                ]),
            };
          }
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ id: 1 }]),
          };
        }
        return createMockQueryChain([createdActivity]);
      });

      const result = await service.create(createDto, 1, {
        roleName: 'Editor',
        permissions: ['activities.create'],
        teamIds: [1],
      });

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.activityStatusId).toBe(1);
    });

    it('should throw ForbiddenException when user lacks create.any and context.teamIds is empty', async () => {
      const createDto = createMockActivityRequest({
        title: 'New Activity',
        leadTeamId: 1,
      });
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length > 0 && typeof args[0] === 'object') {
          const sel = args[0] as Record<string, unknown>;
          if ('ministryId' in sel) {
            return {
              from: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              limit: vi
                .fn()
                .mockResolvedValue([
                  { id: 1, name: 'Test Team', ministryId: 1 },
                ]),
            };
          }
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ id: 1 }]),
          };
        }
        return createMockQueryChain([]);
      });

      await expect(
        service.create(createDto, 1, {
          roleName: 'Editor',
          permissions: ['activities.create'],
          teamIds: [],
        })
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.create(createDto, 1, {
          roleName: 'Editor',
          permissions: ['activities.create'],
          teamIds: [],
        })
      ).rejects.toThrow(
        'You may only create activities for teams you belong to.'
      );
    });

    it('should throw ForbiddenException when user lacks create.any and context.teamIds is undefined', async () => {
      const createDto = createMockActivityRequest({
        title: 'New Activity',
        leadTeamId: 1,
      });
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length > 0 && typeof args[0] === 'object') {
          const sel = args[0] as Record<string, unknown>;
          if ('ministryId' in sel) {
            return {
              from: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              limit: vi
                .fn()
                .mockResolvedValue([
                  { id: 1, name: 'Test Team', ministryId: 1 },
                ]),
            };
          }
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ id: 1 }]),
          };
        }
        return createMockQueryChain([]);
      });

      await expect(
        service.create(createDto, 1, {
          roleName: 'Editor',
          permissions: ['activities.create'],
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user lacks create.any and leadTeamId not in context.teamIds', async () => {
      const createDto = createMockActivityRequest({
        title: 'New Activity',
        leadTeamId: 99,
      });
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length > 0 && typeof args[0] === 'object') {
          const sel = args[0] as Record<string, unknown>;
          if ('ministryId' in sel) {
            return {
              from: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              limit: vi
                .fn()
                .mockResolvedValue([
                  { id: 99, name: 'Other Team', ministryId: 2 },
                ]),
            };
          }
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ id: 1 }]),
          };
        }
        return createMockQueryChain([]);
      });

      await expect(
        service.create(createDto, 1, {
          roleName: 'Editor',
          permissions: ['activities.create'],
          teamIds: [1, 2],
        })
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.create(createDto, 1, {
          roleName: 'Editor',
          permissions: ['activities.create'],
          teamIds: [1, 2],
        })
      ).rejects.toThrow(
        'You may only create activities for teams you belong to.'
      );
    });

    it('should allow create when user has create.any even with empty teamIds', async () => {
      const createDto = createMockActivityRequest({
        title: 'New Activity',
        leadTeamId: 5,
      });
      const createdActivity = createMockActivity({
        id: 3,
        title: 'New Activity',
        leadTeamId: 5,
      });
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([createdActivity]),
      };
      mockDatabaseService.db.transaction = vi.fn(async (callback) => {
        const ministryQuery = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ abbreviation: 'MIN' }]),
        };
        const tx = {
          insert: vi.fn().mockReturnValue(mockInsert),
          select: vi.fn((...args) => {
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
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length > 0 && typeof args[0] === 'object') {
          const sel = args[0] as Record<string, unknown>;
          if ('ministryId' in sel) {
            return {
              from: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              limit: vi
                .fn()
                .mockResolvedValue([{ id: 5, name: 'Team', ministryId: 1 }]),
            };
          }
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ id: 1 }]),
          };
        }
        return createMockQueryChain([createdActivity]);
      });

      const result = await service.create(createDto, 1, {
        roleName: 'Admin',
        permissions: [PERMISSIONS.ACTIVITIES.CREATE_ANY],
        teamIds: [],
      });

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.id).toBe(3);
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

      // Mock select: no-args = existence check then updated activity; with-object = status name then status id then fetch methods
      let noArgsCallCount = 0;
      let withObjCallCount = 0;
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          noArgsCallCount++;
          return createMockQueryChain(
            noArgsCallCount === 1 ? [existingActivity] : [updatedActivity]
          );
        }
        withObjCallCount++;
        if (withObjCallCount === 1) {
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ name: 'changed' }]),
          };
        }
        if (withObjCallCount === 2) {
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ id: 1 }]),
          };
        }
        const fetchChain = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
          leftJoin: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        };
        fetchChain.innerJoin.mockReturnValue(fetchChain);
        fetchChain.leftJoin.mockReturnValue(fetchChain);
        return fetchChain;
      });

      const updateDto = createMockUpdateRequest({
        title: 'Updated Activity',
      });
      const result = await service.update(1, updateDto, 1);

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.title).toBe('Updated Activity');
      expect(mockActivityHistoryService.recordChange).toHaveBeenCalled();
      expect(
        mockActivityHistoryService.recordChange.mock.calls.at(-1)?.[2]
      ).toBe('updated');
    });

    it('should set status to reviewed on update when user has activities.review and markAsReviewed is true', async () => {
      const existingActivity = createMockActivity({ id: 1 });
      const updatedActivity = createMockActivity({
        id: 1,
        title: 'Updated Activity',
        activityStatusId: 2,
      });

      mockDatabaseService.db.transaction = vi.fn(async (callback) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([updatedActivity]),
          }),
          select: vi.fn().mockReturnValue(createMockQueryChain([])),
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        };
        return await callback(tx);
      });

      let noArgsCallCount = 0;
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          noArgsCallCount++;
          return createMockQueryChain(
            noArgsCallCount === 1 ? [existingActivity] : [updatedActivity]
          );
        }
        const selectArg = args[0];
        const isStatusNameQuery =
          selectArg && typeof selectArg === 'object' && 'name' in selectArg;
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi
            .fn()
            .mockResolvedValue(
              isStatusNameQuery ? [{ name: 'changed' }] : [{ id: 2 }]
            ),
        };
      });

      const updateDto = createMockUpdateRequest({
        title: 'Updated Activity',
        markAsReviewed: true,
      });
      const result = await service.update(1, updateDto, 1, {
        permissions: ['activities.review'],
        roleName: 'Admin',
      });

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.activityStatusId).toBe(2);
      expect(mockActivityHistoryService.recordChange).toHaveBeenCalled();
      expect(
        mockActivityHistoryService.recordChange.mock.calls.at(-1)?.[2]
      ).toBe('reviewed');
    });

    it('should set status to reviewed when only markAsReviewed is true and user has activities.review', async () => {
      const existingActivity = createMockActivity({ id: 1 });
      const updatedActivity = createMockActivity({
        id: 1,
        title: 'Test Activity',
        activityStatusId: 2,
      });

      mockDatabaseService.db.transaction = vi.fn(async (callback) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([updatedActivity]),
          }),
          select: vi.fn().mockReturnValue(createMockQueryChain([])),
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        };
        return await callback(tx);
      });

      let noArgsCallCount = 0;
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          noArgsCallCount++;
          return createMockQueryChain(
            noArgsCallCount === 1 ? [existingActivity] : [updatedActivity]
          );
        }
        const selectArg = args[0];
        const isStatusNameQuery =
          selectArg && typeof selectArg === 'object' && 'name' in selectArg;
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi
            .fn()
            .mockResolvedValue(
              isStatusNameQuery ? [{ name: 'changed' }] : [{ id: 2 }]
            ),
        };
      });

      const updateDto = { markAsReviewed: true } as UpdateActivityRequest;
      const result = await service.update(1, updateDto, 1, {
        permissions: ['activities.review'],
        roleName: 'Admin',
      });

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.activityStatusId).toBe(2);
    });

    it('should set status to changed on update when user lacks activities.review even if markAsReviewed is true', async () => {
      const existingActivity = createMockActivity({ id: 1 });
      const updatedActivity = createMockActivity({
        id: 1,
        title: 'Updated Activity',
        activityStatusId: 1,
      });

      mockDatabaseService.db.transaction = vi.fn(async (callback) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([updatedActivity]),
          }),
          select: vi.fn().mockReturnValue(createMockQueryChain([])),
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        };
        return await callback(tx);
      });

      let noArgsCallCount = 0;
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          noArgsCallCount++;
          return createMockQueryChain(
            noArgsCallCount === 1 ? [existingActivity] : [updatedActivity]
          );
        }
        const selectArg = args[0];
        const isStatusNameQuery =
          selectArg && typeof selectArg === 'object' && 'name' in selectArg;
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi
            .fn()
            .mockResolvedValue(
              isStatusNameQuery ? [{ name: 'changed' }] : [{ id: 1 }]
            ),
        };
      });

      const updateDto = createMockUpdateRequest({
        title: 'Updated Activity',
        markAsReviewed: true,
      });
      const result = await service.update(1, updateDto, 1, {
        permissions: ['activities.edit'],
        roleName: 'Editor',
      });

      expect(() => activityResponseSchema.parse(result)).not.toThrow();
      expect(result.activityStatusId).toBe(1);
      expect(mockActivityHistoryService.recordChange).toHaveBeenCalled();
      expect(
        mockActivityHistoryService.recordChange.mock.calls.at(-1)?.[2]
      ).toBe('updated');
    });

    it('should throw ConflictException when activity status is delete_requested', async () => {
      const existingActivity = createMockActivity({
        id: 1,
        activityStatusId: 5,
      });
      mockDatabaseService.db.transaction = vi.fn();
      let _withObjCallCount = 0;
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          return createMockQueryChain([existingActivity]);
        }
        _withObjCallCount++;
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ name: 'delete_requested' }]),
        };
      });

      const updateDto = createMockUpdateRequest({ title: 'Updated' });

      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        ConflictException
      );
      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        /cannot be updated when status is 'delete_requested'/
      );
      expect(mockDatabaseService.db.transaction).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when activity status is deleted', async () => {
      const existingActivity = createMockActivity({
        id: 1,
        activityStatusId: 4,
      });
      mockDatabaseService.db.transaction = vi.fn();
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          return createMockQueryChain([existingActivity]);
        }
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ name: 'deleted' }]),
        };
      });

      const updateDto = createMockUpdateRequest({ title: 'Updated' });

      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        ConflictException
      );
      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        /cannot be updated when status is 'deleted'/
      );
      expect(mockDatabaseService.db.transaction).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when changing leadTeamId and user lacks create.any and context.teamIds is empty', async () => {
      const existingActivity = createMockActivity({ id: 1, leadTeamId: 1 });
      mockDatabaseService.db.transaction = vi.fn();
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          return createMockQueryChain([existingActivity]);
        }
        const selectArg = args[0];
        const isStatusNameQuery =
          selectArg && typeof selectArg === 'object' && 'name' in selectArg;
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi
            .fn()
            .mockResolvedValue(
              isStatusNameQuery ? [{ name: 'draft' }] : [{ id: 1 }]
            ),
        };
      });

      const updateDto = createMockUpdateRequest({ leadTeamId: 5 });

      await expect(
        service.update(1, updateDto, 1, {
          permissions: ['activities.edit'],
          roleName: 'Editor',
          teamIds: [],
        })
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update(1, updateDto, 1, {
          permissions: ['activities.edit'],
          roleName: 'Editor',
          teamIds: [],
        })
      ).rejects.toThrow('You may only set lead team to a team you belong to.');
      expect(mockDatabaseService.db.transaction).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when changing leadTeamId and user lacks create.any and new leadTeamId not in context.teamIds', async () => {
      const existingActivity = createMockActivity({ id: 1, leadTeamId: 1 });
      mockDatabaseService.db.transaction = vi.fn();
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          return createMockQueryChain([existingActivity]);
        }
        const selectArg = args[0];
        const isStatusNameQuery =
          selectArg && typeof selectArg === 'object' && 'name' in selectArg;
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi
            .fn()
            .mockResolvedValue(
              isStatusNameQuery ? [{ name: 'draft' }] : [{ id: 1 }]
            ),
        };
      });

      const updateDto = createMockUpdateRequest({ leadTeamId: 99 });

      await expect(
        service.update(1, updateDto, 1, {
          permissions: ['activities.edit'],
          roleName: 'Editor',
          teamIds: [1, 2],
        })
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update(1, updateDto, 1, {
          permissions: ['activities.edit'],
          roleName: 'Editor',
          teamIds: [1, 2],
        })
      ).rejects.toThrow('You may only set lead team to a team you belong to.');
      expect(mockDatabaseService.db.transaction).not.toHaveBeenCalled();
    });
  });

  describe('requestDelete', () => {
    it('should set status to delete_requested and record history', async () => {
      const existingActivity = createMockActivity({
        id: 1,
        activityStatusId: 1,
      });
      const updatedActivity = createMockActivity({
        id: 1,
        activityStatusId: 5,
      });
      let selectCallCount = 0;
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          selectCallCount++;
          return createMockQueryChain(
            selectCallCount === 1 ? [existingActivity] : []
          );
        }
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ id: 5 }]),
        };
      });
      mockDatabaseService.db.transaction = vi.fn(async (callback) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([updatedActivity]),
          }),
        };
        return await callback(tx);
      });

      const result = await service.requestDelete(
        1,
        'Reason with at least ten characters',
        10
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(mockActivityHistoryService.recordChange).toHaveBeenCalledWith(
        1,
        10,
        'delete_requested',
        [
          {
            field: 'activityStatusId',
            oldValue: existingActivity.activityStatusId,
            newValue: 5,
          },
        ],
        'Reason with at least ten characters',
        expect.anything()
      );
    });

    it('should throw ConflictException when status is already delete_requested', async () => {
      const existingActivity = createMockActivity({
        id: 1,
        activityStatusId: 5,
      });
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          return createMockQueryChain([existingActivity]);
        }
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ name: 'delete_requested' }]),
        };
      });

      await expect(
        service.requestDelete(1, 'Reason with at least ten characters', 10)
      ).rejects.toThrow(ConflictException);
      await expect(
        service.requestDelete(1, 'Reason with at least ten characters', 10)
      ).rejects.toThrow(/already 'delete_requested'/);
      expect(mockDatabaseService.db.transaction).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when status is already deleted', async () => {
      const existingActivity = createMockActivity({
        id: 1,
        activityStatusId: 4,
      });
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          return createMockQueryChain([existingActivity]);
        }
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ name: 'deleted' }]),
        };
      });

      await expect(
        service.requestDelete(1, 'Reason with at least ten characters', 10)
      ).rejects.toThrow(ConflictException);
      expect(mockDatabaseService.db.transaction).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('should add a standalone history note', async () => {
      mockDatabaseService.db.select = vi.fn(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 1 }]),
      }));
      mockActivityHistoryService.recordChange.mockResolvedValueOnce({ id: 25 });
      mockActivityHistoryService.getHistoryEntryById.mockResolvedValueOnce({
        id: 25,
        activityId: 1,
        userId: 10,
        actionType: 'note_added',
        changes: null,
        notes: 'A note for history',
        timestamp: new Date().toISOString(),
        actor: {
          id: 10,
          displayName: 'Test User',
          username: 'test.user',
        },
        userName: 'Test User',
      });

      const result = await service.addHistoryNote(1, 'A note for history', 10);

      expect(mockActivityHistoryService.recordChange).toHaveBeenCalledWith(
        1,
        10,
        'note_added',
        undefined,
        'A note for history'
      );
      expect(
        mockActivityHistoryService.getHistoryEntryById
      ).toHaveBeenCalledWith(25);
      expect(result.actionType).toBe('note_added');
      expect(result.notes).toBe('A note for history');
    });

    it('should restore activity using previous status from history', async () => {
      const existingActivity = createMockActivity({
        id: 1,
        activityStatusId: 5,
      });
      const restoredActivity = createMockActivity({
        id: 1,
        activityStatusId: 2,
      });
      mockActivityHistoryService.getPreviousStatusIdBeforeDelete.mockResolvedValue(
        2
      );
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          return createMockQueryChain([existingActivity]);
        }
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ name: 'delete_requested' }]),
        };
      });
      mockDatabaseService.db.transaction = vi.fn(async (callback) => {
        const tx = {};
        return await callback(tx);
      });
      mockDataFetcherService.fetchCategoriesForActivities.mockResolvedValue({
        namesMap: new Map([[1, []]]),
        idsMap: new Map([[1, []]]),
      });
      mockDataFetcherService.fetchActivityStatusesForActivities.mockResolvedValue(
        new Map([[1, 'reviewed']])
      );
      mockDataFetcherService.fetchDateStatusesForActivities.mockResolvedValue(
        new Map([[1, 'confirmed']])
      );
      mockDataFetcherService.fetchTimeStatusesForActivities.mockResolvedValue(
        new Map([[1, 'confirmed']])
      );
      mockDataFetcherService.fetchVenueStatusesForActivities.mockResolvedValue(
        new Map([[1, 'Venue TBD']])
      );
      mockDataFetcherService.fetchVenueAddressesForActivities.mockResolvedValue(
        new Map([[1, null]])
      );
      mockDataFetcherService.fetchCommsMaterialsForActivities.mockResolvedValue(
        new Map([[1, []]])
      );
      mockDataFetcherService.fetchTranslationsRequiredForActivities.mockResolvedValue(
        new Map([[1, []]])
      );
      mockDataFetcherService.fetchRepresentativesAttendingForActivities.mockResolvedValue(
        new Map([[1, []]])
      );
      mockDataFetcherService.fetchSharedWithTeamsForActivities.mockResolvedValue(
        new Map([[1, []]])
      );
      mockDataFetcherService.fetchCommsContactsForActivities.mockResolvedValue(
        new Map([[1, []]])
      );
      mockDataFetcherService.fetchLeadOrgNamesForActivities.mockResolvedValue(
        new Map([[1, null]])
      );
      mockDataFetcherService.fetchEventPlannerDetailsForActivities.mockResolvedValue(
        new Map([[1, []]])
      );
      mockDataFetcherService.fetchNewsReleaseOriginsForActivities.mockResolvedValue(
        new Map([[1, null]])
      );
      mockDataFetcherService.fetchNewsReleaseDistributionsForActivities.mockResolvedValue(
        new Map([[1, null]])
      );
      mockDataFetcherService.fetchPremierRequestedForActivities.mockResolvedValue(
        new Map([[1, null]])
      );
      mockDataFetcherService.fetchReportSettingsForActivities.mockResolvedValue(
        new Map([[1, []]])
      );

      const txCapture: unknown[] = [];
      mockDatabaseService.db.transaction = vi.fn(async (callback) => {
        const tx = { _capture: true };
        txCapture.push(tx);
        const [updatedActivity] = [restoredActivity];
        return await callback(
          Object.assign(tx, {
            update: vi.fn().mockReturnValue({
              set: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              returning: vi.fn().mockResolvedValue([updatedActivity]),
            }),
          })
        );
      });

      const result = await service.restore(1, 10, 'Restored', {
        roleName: 'Editor',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(
        mockActivityHistoryService.getPreviousStatusIdBeforeDelete
      ).toHaveBeenCalledWith(1);
      expect(mockActivityHistoryService.recordChange).toHaveBeenCalledWith(
        1,
        10,
        'restored',
        [
          {
            field: 'activityStatusId',
            oldValue: existingActivity.activityStatusId,
            newValue: 2,
          },
        ],
        'Restored',
        expect.anything()
      );
    });

    it('should throw BadRequestException when status is not delete_requested or deleted', async () => {
      const existingActivity = createMockActivity({
        id: 1,
        activityStatusId: 1,
      });
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          return createMockQueryChain([existingActivity]);
        }
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ name: 'changed' }]),
        };
      });

      await expect(service.restore(1, 10, undefined)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.restore(1, 10, undefined)).rejects.toThrow(
        /can only be restored when status is delete_requested or deleted/
      );
      expect(mockDatabaseService.db.transaction).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should write to deletion_audit, delete child rows, and delete activity in a transaction', async () => {
      const existingActivity = createMockActivity({ id: 1 });
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          return createMockQueryChain([existingActivity]);
        }
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        };
      });

      const insertValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
      });
      const deleteWhere = vi.fn().mockResolvedValue(undefined);
      const mockTx = {
        insert: vi.fn().mockReturnValue({ values: insertValues }),
        delete: vi.fn().mockReturnValue({ where: deleteWhere }),
      };
      mockDatabaseService.db.transaction = vi.fn(async (callback) => {
        return await callback(mockTx);
      });

      const result = await service.remove(
        1,
        10,
        {
          permissions: ['activities.delete', 'activities.delete.any'],
          teamIds: [1],
        },
        { reason: 'Duplicate entry' }
      );

      expect(result).toEqual({ message: 'Activity #1 deleted successfully' });
      expect(mockDatabaseService.db.transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.insert).toHaveBeenCalledTimes(1);
      expect(insertValues).toHaveBeenCalledWith({
        activityId: 1,
        userId: 10,
        reason: 'Duplicate entry',
      });
      expect(mockTx.delete).toHaveBeenCalled();
      expect(deleteWhere).toHaveBeenCalled();
      expect(mockTx.delete.mock.calls.length).toBeGreaterThanOrEqual(14);
    });

    it('should throw ForbiddenException when user lacks delete.any and is not comms/lead-team', async () => {
      mockPolicyService.isCommsContactForActivity.mockResolvedValue(false);
      mockPolicyService.getLeadTeamIdForActivity.mockResolvedValue(10);
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          return createMockQueryChain([createMockActivity({ id: 1 })]);
        }
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        };
      });

      await expect(
        service.remove(1, 10, {
          permissions: ['activities.delete'],
          teamIds: [99],
        })
      ).rejects.toThrow(
        'You may only delete activities where you are a comms contact or lead-team member, or have activities.delete.any.'
      );
      expect(mockDatabaseService.db.transaction).not.toHaveBeenCalled();
      expect(mockPolicyService.isCommsContactForActivity).toHaveBeenCalledWith(
        1,
        10
      );
      expect(mockPolicyService.getLeadTeamIdForActivity).toHaveBeenCalledWith(
        1
      );
    });

    it('should allow remove when user lacks delete.any but is comms contact', async () => {
      mockPolicyService.isCommsContactForActivity.mockResolvedValue(true);
      mockPolicyService.getLeadTeamIdForActivity.mockResolvedValue(10);
      const existingActivity = createMockActivity({ id: 1 });
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          return createMockQueryChain([existingActivity]);
        }
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        };
      });
      const insertValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
      });
      const deleteWhere = vi.fn().mockResolvedValue(undefined);
      const mockTx = {
        insert: vi.fn().mockReturnValue({ values: insertValues }),
        delete: vi.fn().mockReturnValue({ where: deleteWhere }),
      };
      mockDatabaseService.db.transaction = vi.fn(async (callback) => {
        return await callback(mockTx);
      });

      const result = await service.remove(1, 10, {
        permissions: ['activities.delete'],
        teamIds: [5],
      });

      expect(result).toEqual({ message: 'Activity #1 deleted successfully' });
      expect(mockPolicyService.isCommsContactForActivity).toHaveBeenCalledWith(
        1,
        10
      );
    });

    it('should allow remove when user lacks delete.any but is lead-team member', async () => {
      mockPolicyService.isCommsContactForActivity.mockResolvedValue(false);
      mockPolicyService.getLeadTeamIdForActivity.mockResolvedValue(10);
      const existingActivity = createMockActivity({ id: 1 });
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          return createMockQueryChain([existingActivity]);
        }
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        };
      });
      const insertValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
      });
      const deleteWhere = vi.fn().mockResolvedValue(undefined);
      const mockTx = {
        insert: vi.fn().mockReturnValue({ values: insertValues }),
        delete: vi.fn().mockReturnValue({ where: deleteWhere }),
      };
      mockDatabaseService.db.transaction = vi.fn(async (callback) => {
        return await callback(mockTx);
      });

      const result = await service.remove(1, 10, {
        permissions: ['activities.delete'],
        teamIds: [10, 20],
      });

      expect(result).toEqual({ message: 'Activity #1 deleted successfully' });
      expect(mockPolicyService.getLeadTeamIdForActivity).toHaveBeenCalledWith(
        1
      );
    });
  });

  describe('softDelete', () => {
    it('should throw ForbiddenException when user lacks delete.any and is not comms/lead-team', async () => {
      mockPolicyService.isCommsContactForActivity.mockResolvedValue(false);
      mockPolicyService.getLeadTeamIdForActivity.mockResolvedValue(10);
      const existingActivity = createMockActivity({ id: 1 });
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length === 0) {
          return createMockQueryChain([existingActivity]);
        }
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        };
      });

      await expect(
        service.softDelete(1, 'Duplicate entry reason here', 10, {
          permissions: ['activities.delete'],
          teamIds: [99],
        })
      ).rejects.toThrow(
        'You may only delete activities where you are a comms contact or lead-team member, or have activities.delete.any.'
      );
      expect(mockDatabaseService.db.transaction).not.toHaveBeenCalled();
      expect(mockPolicyService.isCommsContactForActivity).toHaveBeenCalledWith(
        1,
        10
      );
    });
  });

  describe('comms contacts validation against lead team', () => {
    it('should reject create when commsContacts userId is not eligible for lead team', async () => {
      mockTeamsService.getEligibleCommsUserIds.mockResolvedValue(
        new Set([2, 3])
      );

      const dto = createMockActivityRequest({
        leadTeamId: 5,
        commsContacts: [{ userId: 99, isLead: true }],
      });

      const statusRow = [{ id: 3, name: 'new' }];
      const teamRow = [{ id: 5, name: 'Team', ministryId: 1 }];

      mockDatabaseService.db.select = vi.fn(() => {
        const chain = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn(),
        };
        chain.limit
          .mockResolvedValueOnce(statusRow)
          .mockResolvedValueOnce(teamRow)
          .mockResolvedValueOnce([{ id: 1 }])
          .mockResolvedValueOnce([{ id: 1 }]);
        return chain;
      });

      await expect(
        service.create(dto, 1, {
          permissions: [
            PERMISSIONS.ACTIVITIES.CREATE,
            PERMISSIONS.ACTIVITIES.EDIT,
            PERMISSIONS.ACTIVITIES.CREATE_ANY,
          ],
          teamIds: [5],
        })
      ).rejects.toThrow(BadRequestException);

      expect(mockTeamsService.getEligibleCommsUserIds).toHaveBeenCalledWith(5);
    });

    it('should not reject create when commsContacts are all eligible for lead team', async () => {
      mockTeamsService.getEligibleCommsUserIds.mockResolvedValue(
        new Set([1, 2])
      );

      const dto = createMockActivityRequest({
        leadTeamId: 5,
        commsContacts: [{ userId: 1, isLead: true }],
      });

      const statusRow = [{ id: 3, name: 'new' }];
      const teamRow = [{ id: 5, name: 'Team', ministryId: 1 }];

      mockDatabaseService.db.select = vi.fn(() => {
        const chain = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn(),
        };
        chain.limit
          .mockResolvedValueOnce(statusRow)
          .mockResolvedValueOnce(teamRow)
          .mockResolvedValueOnce([{ id: 1 }])
          .mockResolvedValueOnce([{ id: 1 }]);
        return chain;
      });

      mockDatabaseService.db.transaction.mockRejectedValue(
        new Error('STOP: validation passed')
      );

      await expect(
        service.create(dto, 1, {
          permissions: [
            PERMISSIONS.ACTIVITIES.CREATE,
            PERMISSIONS.ACTIVITIES.EDIT,
            PERMISSIONS.ACTIVITIES.CREATE_ANY,
          ],
          teamIds: [5],
        })
      ).rejects.toThrow('STOP: validation passed');

      expect(mockTeamsService.getEligibleCommsUserIds).toHaveBeenCalledWith(5);
    });
  });
});
