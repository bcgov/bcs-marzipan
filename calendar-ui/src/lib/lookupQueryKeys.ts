/**
 * Centralized React Query key factory for lookup and lookup-style lists.
 *
 * All keys are rooted at `['lookups']` so callers can invalidate the entire
 * tree with `invalidateQueries({ queryKey: lookupQueryKeys.root })` (see `teams`
 * and `teamsList` for the users API list that uses this prefix for the same
 * reason).
 *
 * For `/lookups/<segment>` routes, the second segment mirrors the backend path
 * (kebab-case) so keys stay easy to audit against the controller.
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
  /** Admin categories list (`includeAll=true`). Shares the `['lookups', 'categories']` prefix. */
  categoriesAdmin: () => ['lookups', 'categories', 'admin'] as const,
  cities: () => ['lookups', 'cities'] as const,
  commsMaterials: () => ['lookups', 'comms-materials'] as const,
  activityStatuses: () => ['lookups', 'activity-statuses'] as const,
  pitchStatuses: () => ['lookups', 'pitch-statuses'] as const,
  governmentRepresentatives: () =>
    ['lookups', 'government-representatives'] as const,
  ministries: () => ['lookups', 'ministries'] as const,
  ministryGroups: () => ['lookups', 'ministry-groups'] as const,
  /** Teams + ministry quick-share payload for activity Shared with (`GET /lookups/activity-team-sharing`). */
  activityTeamSharing: () => ['lookups', 'activity-team-sharing'] as const,
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

  /**
   * Team options from `GET /users/teams` (`fetchTeams`). Shared prefix with lookups
   * so global `['lookups']` invalidation refreshes team pickers after lookup/seed work.
   */
  teams: () => ['lookups', 'teams'] as const,
  /**
   * Teams admin table list (`fetchTeamsList`). Inherits the `['lookups', 'teams']`
   * prefix so it refetches with the same invalidation as `teams()`.
   */
  teamsList: (showInactive: boolean) =>
    ['lookups', 'teams', 'list', showInactive] as const,
  /**
   * Comms contact candidate list for a team (`/teams/:id/comms-contact-candidates`).
   * Shares the `['lookups', 'teams', ...]` prefix for invalidation.
   */
  teamsCommsContactCandidates: (teamId: number) =>
    ['lookups', 'teams', teamId, 'comms-contact-candidates'] as const,
  /** Lead team picker options (`GET /teams/lead-options` for activity forms). */
  teamsLeadOptions: () => ['lookups', 'teams', 'lead-options'] as const,
} as const;

/** Readonly array variant of any factory return; useful for `GenericLookupAdmin` props. */
export type LookupQueryKey = readonly unknown[];
