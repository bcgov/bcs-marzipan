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
    createdDateTime: now,
    lastUpdatedDateTime: now,
    createdBy: 'test-user',
    lastUpdatedBy: 'test-user',
    category: ['Education'],
    owner: null,
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
