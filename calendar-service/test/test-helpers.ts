import type {
  CreateActivityRequest,
  UpdateActivityRequest,
} from '@corpcal/shared/schemas';
import type { ActivityResponse } from '@corpcal/shared/api';

/**
 * Test Data Factory
 * Provides helper functions to generate test data for activities
 */

export const createMockActivityRequest = (
  overrides?: Partial<CreateActivityRequest>
): CreateActivityRequest => {
  return {
    title: 'Test Activity',
    summary: 'This is a test activity',
    isIssue: false,
    isActive: true,
    isAllDay: false,
    startDate: '2025-01-15',
    startTime: '10:00',
    endDate: '2025-01-15',
    endTime: '12:00',
    dateStatusId: 1,
    timeStatusId: 1,
    pitchStatusId: 1,
    activityStatusId: 1,
    ownerId: 1,
    calendarVisibility: 'visible',
    notForLookAhead: false,
    notForThirtySixtyNinety: false,
    ...overrides,
  };
};

export const createMockUpdateRequest = (
  overrides?: Partial<UpdateActivityRequest>
): UpdateActivityRequest => {
  return {
    title: 'Updated Activity',
    summary: 'This activity has been updated',
    ...overrides,
  };
};

export const createMockActivityResponse = (
  overrides?: Partial<ActivityResponse>
): ActivityResponse => {
  const now = new Date().toISOString();
  return {
    id: 1,
    displayId: 'ACT-1',
    activityStatusId: '1',
    pitchStatusId: '1',
    dateStatusId: '1',
    timeStatusId: '1',
    venueStatusId: null,
    category: ['Education'],
    title: 'Test Activity',
    summary: 'Test summary',
    isIssue: false,
    isActive: true,
    leadOrgId: null,
    leadOrgName: null,
    leadOrg: null,
    eventLeadOrgId: null,
    eventLeadOrgName: null,
    eventLeadOrg: null,
    jointOrg: [],
    relatedActivities: [],
    tags: [],
    significance: '',
    pitchStatus: 'Pending',
    dateStatus: '1',
    timeStatus: '1',
    venueStatus: null,
    pitchComments: null,
    isAllDay: false,
    startDate: '2025-01-15',
    startTime: '10:00',
    endDate: '2025-01-15',
    endTime: '12:00',
    schedulingConsiderations: '',
    commsMaterials: [],
    newsReleaseId: null,
    translationsRequired: [],
    jointEventOrg: [],
    representativesAttending: [],
    venue: null,
    venueAddress: null,
    eventLeadId: null,
    eventLead: null,
    eventLeadName: null,
    graphicsUserId: null,
    graphics: null,
    notForLookAhead: false,
    notForThirtySixtyNinety: false,
    lookAheadStatus: null,
    lookAheadSection: null,
    ownerId: '1',
    owner: '1',
    additionalOwnerId: null,
    ministryOwnerId: null,
    sharedWith: [],
    canEdit: [],
    canView: [],
    calendarVisibility: 'visible',
    createdDateTime: now,
    createdBy: 'test-user',
    lastUpdatedDateTime: now,
    lastUpdatedBy: 'test-user',
    ...overrides,
  };
};

/**
 * Wait for a specified duration (useful for async tests)
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Mock database service for unit tests
 * Provides a complete mock of the Drizzle ORM query builder
 */
export const createMockDatabaseService = () => ({
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
  },
});

/**
 * Mock ActivitiesGateway for unit tests
 * Provides mocks for WebSocket notification methods
 */
export const createMockActivitiesGateway = () => ({
  notifyActivityUpdate: jest.fn(),
  server: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  },
});
