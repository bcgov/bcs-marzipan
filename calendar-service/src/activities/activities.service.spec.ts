import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import type { Activity } from '@corpcal/database/types';
import { activityResponseSchema } from '@corpcal/shared/schemas';

import {
  createMockActivity,
  createMockActivityRequest,
  createMockUpdateRequest,
} from '../common/test-utils';
import { DatabaseService } from '../database/database.service';
import { LocksService } from '../locks/locks.service';
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
  };

  // Mock data fetcher service (from shared factory to stay in sync with ActivityDataFetcherService)
  const mockDataFetcherService = createMockActivityDataFetcherService();

  // Mock utils service
  const mockUtilsService = {
    generateDisplayId: vi.fn(
      (abbrev, id) =>
        `${abbrev.toUpperCase()}-${id.toString().slice(-6).padStart(6, '0')}`
    ),
    validateCategoryIds: vi.fn().mockResolvedValue(undefined),
  };

  // Mock locks service (added when ActivitiesService started using LocksService)
  const mockLocksService = {
    getLockForEntity: vi.fn().mockResolvedValue(null),
    releaseLock: vi.fn().mockResolvedValue(undefined),
    tryAcquireLock: vi.fn().mockResolvedValue({}),
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
        eventPlannerLeadId: 3,
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

      // Mock select: status lookup (with object) returns status id; findOne (no args) returns created activity
      mockDatabaseService.db.select = vi.fn((...args) => {
        if (args.length > 0) {
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ id: 1 }]),
          };
        }
        return createMockQueryChain([createdActivity]);
      });

      const result = await service.create(createDto, 1);

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
      mockDataFetcherService.fetchEventPlannerNamesForActivities.mockResolvedValue(
        new Map([[1, null]])
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
});
