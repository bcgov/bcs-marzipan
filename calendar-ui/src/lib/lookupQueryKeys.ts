/**
 * Centralized React Query key factory for lookup data.
 *
 * All keys are rooted at `['lookups']` so callers can invalidate the entire
 * lookup cache with `invalidateQueries({ queryKey: lookupQueryKeys.root })`.
 *
 * Second segments mirror the backend URL segment (kebab-case) for each
 * `/lookups/<segment>` route, which keeps them easy to audit against the
 * controller and gives a single place to add future lookups.
 *
 * Tag list has two variants that share the `['lookups', 'tags']` prefix:
 * - `tags()` - user-scoped list (no `includeAll`) used by forms, pickers, etc.
 * - `tagsAdmin()` - admin list (`includeAll=true`) used by the Settings admin.
 * Invalidating the prefix `['lookups', 'tags']` refreshes both variants.
 */

import type { LookupQueryParams } from '../api/lookupsApi';

export const lookupQueryKeys = {
  /** Root prefix; invalidating this refreshes every lookup query. */
  root: ['lookups'] as const,

  categories: () => ['lookups', 'categories'] as const,
  cities: () => ['lookups', 'cities'] as const,
  commsMaterials: () => ['lookups', 'comms-materials'] as const,
  activityStatuses: () => ['lookups', 'activity-statuses'] as const,
  pitchStatuses: () => ['lookups', 'pitch-statuses'] as const,
  governmentRepresentatives: () =>
    ['lookups', 'government-representatives'] as const,
  ministries: () => ['lookups', 'ministries'] as const,
  ministryGroups: () => ['lookups', 'ministry-groups'] as const,
  themes: () => ['lookups', 'themes'] as const,
  venuePresets: () => ['lookups', 'venue-presets'] as const,
  venueStatuses: () => ['lookups', 'venue-statuses'] as const,
  eventPlanners: () => ['lookups', 'event-planners'] as const,
  newsReleaseDistributions: () =>
    ['lookups', 'news-release-distributions'] as const,
  newsReleaseOrigins: () => ['lookups', 'news-release-origins'] as const,
  premierRequested: () => ['lookups', 'premier-requested'] as const,
  dateStatuses: () => ['lookups', 'date-statuses'] as const,
  timeStatuses: () => ['lookups', 'time-statuses'] as const,
  pitchRequiredStatuses: () => ['lookups', 'pitch-required-statuses'] as const,
  translationRequiredStatuses: () =>
    ['lookups', 'translation-required-statuses'] as const,
  translationLanguages: () => ['lookups', 'translation-languages'] as const,

  users: (params?: LookupQueryParams) => ['lookups', 'users', params] as const,
  organizations: (params?: LookupQueryParams) =>
    ['lookups', 'organizations', params] as const,
  activities: (params?: Pick<LookupQueryParams, 'userId' | 'role'>) =>
    ['lookups', 'activities', params] as const,

  /** User-scoped tags list (no `includeAll`). */
  tags: () => ['lookups', 'tags'] as const,
  /** Admin tags list (`includeAll=true`). Shares the `['lookups', 'tags']` prefix. */
  tagsAdmin: () => ['lookups', 'tags', 'admin'] as const,

  /** Reports list (single source of truth for Settings/Reports page and activity form). */
  reports: () => ['lookups', 'reports'] as const,
} as const;

/** Readonly array variant of any factory return; useful for `GenericLookupAdmin` props. */
export type LookupQueryKey = readonly unknown[];
