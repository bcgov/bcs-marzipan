import { vi } from 'vitest';

import type { EventPlannerDetail } from '@corpcal/shared/schemas';

/**
 * Default return values for ActivityDataFetcherService methods.
 * When adding a new method to ActivityDataFetcherService, add it here to avoid test drift.
 */
const DEFAULTS = {
  fetchCategoriesForActivities: {
    namesMap: new Map<number, string[]>(),
    idsMap: new Map<number, number[]>(),
  },
  fetchTagsForActivities: new Map(),
  fetchNewsReleaseOriginsForActivities: new Map(),
  fetchNewsReleaseDistributionsForActivities: new Map(),
  fetchPremierRequestedForActivities: new Map(),
  fetchDateStatusesForActivities: new Map(),
  fetchTimeStatusesForActivities: new Map(),
  fetchVenueAddressesForActivities: new Map(),
  fetchActivityStatusesForActivities: new Map(),
  fetchCommsMaterialsForActivities: new Map(),
  fetchTranslationsRequiredForActivities: new Map(),
  fetchRepresentativesAttendingForActivities: new Map(),
  fetchSharedWithTeamsForActivities: new Map(),
  fetchCommsContactsForActivities: new Map(),
  fetchUserNamesForUserIds: new Map(),
  fetchLeadOrgNamesForActivities: new Map(),
  fetchEventPlannerDetailsForActivities: new Map() as Map<
    number,
    EventPlannerDetail[]
  >,
  fetchEventPlannersForActivities: new Map() as Map<number, string[]>,
  fetchEventPlannerIdsForActivities: new Map() as Map<number, number[]>,
  fetchReportSettingsForActivities: new Map(),
  fetchPitchRequiredStatusForActivities: new Map() as Map<
    number,
    string | null
  >,
  fetchTranslationsRequiredStatusForActivities: new Map() as Map<
    number,
    string | null
  >,
  fetchLeadMinistryNamesForActivities: new Map(),
  fetchLeadMinistryAbbreviationsForActivities: new Map() as Map<
    number,
    string | null
  >,
} as const;

type MockDataFetcher = {
  [K in keyof typeof DEFAULTS]: ReturnType<typeof vi.fn>;
};

/**
 * Creates a mock ActivityDataFetcherService with all methods stubbed.
 * Override in tests via mockDataFetcherService.fetchX.mockResolvedValue(...).
 * When ActivityDataFetcherService gains a new method, add it to DEFAULTS above.
 */
export function createMockActivityDataFetcherService(): MockDataFetcher {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const key of Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]) {
    mock[key] = vi.fn().mockResolvedValue(DEFAULTS[key]);
  }
  return mock as MockDataFetcher;
}
