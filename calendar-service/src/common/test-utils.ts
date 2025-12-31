import type {
  CreateActivityRequest,
  UpdateActivityRequest,
  ActivityResponse,
} from '@corpcal/shared/schemas';

/**
 * Helper functions to generate test data for activities
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
    isActive: true,
    activityStatusId: '1',
    category: ['Event'],
    title: 'Test Activity',
    summary: 'Test summary',
    significance: '',
    isIssue: false,
    isAllDay: false,
    startDate: '2025-01-15',
    startTime: '10:00',
    endDate: '2025-01-15',
    endTime: '12:00',
    dateStatus: '1',
    dateStatusId: '1',
    timeStatus: '1',
    timeStatusId: '1',
    pitchStatus: 'Pending',
    pitchStatusId: '1',
    venueStatus: null,
    venueStatusId: null,
    leadOrgId: null,
    leadOrgName: null,
    leadOrg: null,
    eventLeadOrgId: null,
    eventLeadOrgName: null,
    eventLeadOrg: null,
    jointOrg: [],
    relatedActivities: [],
    tags: [],
    pitchComments: null,
    schedulingConsiderations: '',
    commsMaterials: [],
    newsReleaseId: null,
    newsReleaseOriginId: null,
    newsReleaseOriginName: null,
    translationsRequired: [],
    jointEventOrg: [],
    representativesAttending: [],
    venue: null,
    venueAddress: null,
    eventLeadId: null,
    eventLead: null,
    eventLeadName: null,
    graphicsUserId: null,
    graphicsUser: null,
    notForLookAhead: false,
    notForThirtySixtyNinety: false,
    lookAheadStatus: null,
    lookAheadSection: null,
    ownerId: '1',
    owner: '1',
    additionalOwners: [],
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
