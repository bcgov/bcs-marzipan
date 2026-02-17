import type { Activity } from '@corpcal/database/types';
import type {
  CreateActivityRequest,
  UpdateActivityRequest,
} from '@corpcal/shared/schemas';

/**
 * Helper functions to generate test data for activities
 */

// Re-export shared test fixtures for ActivityResponse
export { createMockActivityResponse } from '@corpcal/shared/test-utils';

export const createMockActivityRequest = (
  overrides?: Partial<CreateActivityRequest>
): CreateActivityRequest => {
  return {
    title: 'Test Activity',
    summary: 'This is a test activity',
    significance: '',
    schedulingNotes: '',
    isIssue: false,
    isConfidential: false,
    isAllDay: false,
    startDate: '2025-01-15',
    startTime: '10:00',
    endDate: '2025-01-15',
    endTime: '12:00',
    dateStatusId: 1,
    timeStatusId: 1,
    activityStatusId: 1,
    leadMinistryId: 1, // Office of the Premier (from seed)
    visibility: 'global',
    leadOrgName: 'Test Org', // XOR with leadOrgId: exactly one must be set
    eventPlannerLeadName: 'Test Lead', // XOR with eventPlannerLeadId: exactly one must be set
    commsContacts: [{ userId: 1, isLead: true }],
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

export const createMockActivity = (overrides?: Partial<Activity>): Activity => {
  const now = new Date();
  return {
    id: 1,
    displayId: 'MIN-000001',
    activityStatusId: 1,
    title: 'Test Activity',
    summary: 'Test summary',
    isIssue: false,
    isConfidential: false,
    leadOrgId: null,
    leadOrgName: null,
    significance: '',
    dateStatusId: 1,
    timeStatusId: 1,
    isAllDay: false,
    startDate: new Date('2024-01-15').toISOString(),
    startTime: '10:00',
    endDate: new Date('2024-01-15').toISOString(),
    endTime: '12:00',
    schedulingNotes: '',
    strategy: null,
    newsReleaseId: null,
    newsReleaseDateTime: null,
    newsReleaseOriginId: null,
    newsReleaseDistributionId: null,
    eventPlannerLeadId: null,
    eventPlannerLeadName: null,
    executiveSummary: null,
    lookAheadStatus: 'none',
    lookAheadSection: 'events',
    notes: null,
    pitchDate: null,
    pitchRequiredStatusId: null,
    translationsRequiredStatusId: null,
    premierRequestedId: null,
    visibility: 'global',
    leadMinistryId: 1,
    createdDateTime: now,
    createdBy: 1,
    lastUpdatedDateTime: now,
    lastUpdatedBy: 1,
    rowVersion: 0,
    ...overrides,
  };
};
