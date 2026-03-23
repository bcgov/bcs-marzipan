import {
  DEFAULT_ACTIVITY_STATUS,
  DEFAULT_VISIBILITY,
} from '../constants/constants';
import type { ActivityResponse } from '../schemas/activity-response.schema';

/**
 * Creates a mock ActivityResponse object for testing.
 *
 * This is the single source of truth for ActivityResponse test fixtures.
 * Use this factory in all tests that need an ActivityResponse object.
 *
 * The factory returns a minimal but schema-valid object using shared constants.
 * All fields can be overridden via the overrides parameter.
 *
 * @param overrides - Partial ActivityResponse to override default values
 * @returns A complete ActivityResponse object
 *
 * @example
 * // Minimal usage
 * const response = createMockActivityResponse();
 *
 * @example
 * // With overrides
 * const response = createMockActivityResponse({
 *   id: 42,
 *   title: 'Custom Title',
 *   lookAheadStatus: 'new',
 * });
 */
export function createMockActivityResponse(
  overrides?: Partial<ActivityResponse>
): ActivityResponse {
  return {
    // Primary key
    id: 1,
    displayId: 'ACT-000001',

    // Status flags
    isIssue: false,
    isConfidential: false,

    // Overview
    title: 'Test Activity',
    summary: 'Test summary',
    significance: 'Test significance',

    // Lead organization
    leadOrgId: null,
    leadOrgName: null,

    // Scheduling
    isAllDay: false,
    startDate: '2025-01-15',
    endDate: '2025-01-15',
    dateStatusId: 1,
    startTime: '10:00',
    endTime: '12:00',
    timeStatusId: 1,
    venueStatusId: 1,
    schedulingNotes: null,
    strategy: null,

    // News Release
    newsReleaseOriginId: null,
    newsReleaseId: null,
    newsReleaseDistributionId: null,

    // Look Ahead
    executiveSummary: null,
    lookAheadStatus: null,
    lookAheadSection: null,

    // Notes and additional fields
    notes: null,
    pitchDate: null,
    pitchRequiredStatusId: null,
    translationsRequiredStatusId: null,
    premierRequestedId: null,
    visibility: DEFAULT_VISIBILITY,

    // Ownership
    leadTeamId: 1,
    leadMinistryId: 1,
    activityStatusId: 1,

    // Audit fields (fixed timestamps for deterministic tests)
    createdBy: 1,
    lastUpdatedBy: 1,
    createdDateTime: '2025-01-15T12:00:00.000Z',
    lastUpdatedDateTime: '2025-01-15T12:00:00.000Z',

    // Computed fields (from joins/lookups)
    category: [],
    tags: [],
    commsMaterials: [],
    translationsRequired: [],
    representativesAttending: [],
    sharedWith: [],
    commsContacts: [],
    leadOrg: null,
    eventPlannerDetails: [],
    eventPlanners: [],
    eventPlannerLeadIds: [],
    dateStatus: 'Set',
    timeStatus: 'Set',
    venueStatus: 'Venue TBD',
    activityStatus: DEFAULT_ACTIVITY_STATUS,
    newsReleaseOrigin: null,
    newsReleaseDistribution: null,
    premierRequested: null,
    pitchRequiredStatus: null,
    translationsRequiredStatus: null,
    leadMinistry: null,
    leadMinistryAbbreviation: null,
    leadTeamDisplayName: null,
    venueAddress: null,
    reportSettings: [],

    // Apply overrides
    ...overrides,
  };
}
