import type {
  CreateActivityRequest,
  UpdateActivityRequest,
  ActivityResponse,
} from '@corpcal/shared/schemas';
import type { Activity } from '@corpcal/database/types';

/**
 * Helper functions to generate test data for activities
 */

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
    leadMinistryId: '00000000-0000-4000-8000-000000000000',
    visibility: 'global',
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

export const createMockActivityResponse = (
  overrides?: Partial<ActivityResponse>
): ActivityResponse => {
  const now = new Date().toISOString();
  return {
    id: 1,
    displayId: 'ACT-1',
    activityStatusId: 1,
    activityStatus: 'new',
    category: ['Event'],
    title: 'Test Activity',
    summary: 'Test summary',
    significance: 'Test significance',
    isIssue: false,
    isAllDay: false,
    isConfidential: false,
    startDate: '2025-01-15',
    startTime: '10:00',
    endDate: '2025-01-15',
    endTime: '12:00',
    dateStatus: '1',
    dateStatusId: 1,
    timeStatus: '1',
    timeStatusId: 1,
    venueAddress: null,
    leadOrgId: null,
    leadOrgName: null,
    leadOrg: null,
    tags: [],
    notes: null,
    pitchDate: null,
    pitchRequired: null,
    schedulingNotes: null,
    commsMaterials: [],
    newsReleaseId: null,
    newsReleaseOriginId: null,
    newsReleaseOrigin: null,
    newsReleaseDistributionId: null,
    newsReleaseDistribution: null,
    translationsRequired: [],
    representativesAttending: [],
    eventPlannerLeadId: null,
    eventLead: null,
    eventPlannerLeadName: null,
    executiveSummary: null,
    lookAheadStatus: null,
    lookAheadSection: null,
    commsContacts: [{ userId: 1, name: 'Test User', isLead: true }],
    leadMinistryId: '00000000-0000-4000-8000-000000000000',
    visibility: 'global',
    sharedWith: [],
    premierRequestedId: null,
    premierRequested: null,
    reportSettings: [],
    createdDateTime: now,
    createdBy: 1,
    lastUpdatedDateTime: now,
    lastUpdatedBy: 1,
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
    pitchRequired: null,
    premierRequestedId: null,
    visibility: 'global',
    leadMinistryId: '00000000-0000-4000-8000-000000000000',
    createdDateTime: now,
    createdBy: 1,
    lastUpdatedDateTime: now,
    lastUpdatedBy: 1,
    rowVersion: 0,
    ...overrides,
  };
};
