import { useQuery } from '@tanstack/react-query';

import {
  DYNAMIC_LOOKUP_CACHE_MS,
  REFERENCE_LOOKUP_CACHE_MS,
} from '@corpcal/shared';
import type {
  ActivityTeamSharingResponse,
  DateStatusLookupItem,
  PitchRequiredStatusLookupItem,
  ReportResponse,
  TimeStatusLookupItem,
  TranslationRequiredStatusLookupItem,
  VenueStatusLookupItem,
} from '@corpcal/shared/api/types';

import { fetchActivityTeamSharing } from '../api/activityTeamSharingApi';
import {
  fetchActivitiesForLookup,
  fetchActivityStatuses,
  fetchCategories,
  fetchCommsMaterials,
  fetchDateStatuses,
  fetchEventPlanners,
  fetchGovernmentRepresentatives,
  fetchMinistries,
  fetchNewsReleaseDistributions,
  fetchNewsReleaseOrigins,
  fetchOrganizations,
  fetchPitchRequiredStatuses,
  fetchPitchStatuses,
  fetchPremierRequested,
  fetchReports,
  fetchTags,
  fetchTimeStatuses,
  fetchTranslationLanguages,
  fetchTranslationRequiredStatuses,
  fetchUsers,
  fetchVenueStatuses,
  type ActivityStatusLookupItem,
  type CategoryLookupItem,
  type CommsMaterialsLookupItem,
  type GovernmentRepresentativeLookupItem,
  type LookupItem,
  type LookupQueryParams,
  type MinistryLookupItem,
  type OrganizationLookupItem,
  type PitchStatusLookupItem,
  type TagLookupItem,
  type TranslationLanguageLookupItem,
  type UserLookupItem,
} from '../api/lookupsApi';
import { fetchTeams } from '../api/usersApi';

type TeamLookupItem = Awaited<ReturnType<typeof fetchTeams>>[number];

const ACTIVITY_TEAM_SHARING_QUERY_KEY = [
  'lookups',
  'activity-team-sharing',
] as const;

/**
 * Teams plus ministry quick-share groups for activity create/edit (single payload).
 */
export function useActivityTeamSharing() {
  return useQuery<ActivityTeamSharingResponse>({
    queryKey: ACTIVITY_TEAM_SHARING_QUERY_KEY,
    queryFn: fetchActivityTeamSharing,
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useCategories() {
  return useQuery<CategoryLookupItem[]>({
    queryKey: ['lookups', 'categories'],
    queryFn: () => fetchCategories(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useOrganizations(params?: LookupQueryParams) {
  return useQuery<OrganizationLookupItem[]>({
    queryKey: ['lookups', 'organizations', params],
    queryFn: () => fetchOrganizations(params),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useUsers(params?: LookupQueryParams) {
  return useQuery<UserLookupItem[]>({
    queryKey: ['lookups', 'users', params],
    queryFn: () => fetchUsers(params),
    staleTime: DYNAMIC_LOOKUP_CACHE_MS,
  });
}

export function useTeams() {
  return useQuery<TeamLookupItem[]>({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useTags() {
  return useQuery<TagLookupItem[]>({
    queryKey: ['lookups', 'tags'],
    queryFn: () => fetchTags(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function usePitchStatuses() {
  return useQuery<PitchStatusLookupItem[]>({
    queryKey: ['lookups', 'pitch-statuses'],
    queryFn: () => fetchPitchStatuses(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useActivityStatuses() {
  return useQuery<ActivityStatusLookupItem[]>({
    queryKey: ['lookups', 'activity-statuses'],
    queryFn: () => fetchActivityStatuses(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useCommsMaterials() {
  return useQuery<CommsMaterialsLookupItem[]>({
    queryKey: ['lookups', 'comms-materials'],
    queryFn: () => fetchCommsMaterials(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useTranslationLanguages() {
  return useQuery<TranslationLanguageLookupItem[]>({
    queryKey: ['lookups', 'translation-languages'],
    queryFn: () => fetchTranslationLanguages(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useGovernmentRepresentatives() {
  return useQuery<GovernmentRepresentativeLookupItem[]>({
    queryKey: ['lookups', 'government-representatives'],
    queryFn: () => fetchGovernmentRepresentatives(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useEventPlanners() {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'event-planners'],
    queryFn: () => fetchEventPlanners(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useNewsReleaseDistributions() {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'news-release-distributions'],
    queryFn: () => fetchNewsReleaseDistributions(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function usePremierRequested() {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'premier-requested'],
    queryFn: () => fetchPremierRequested(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useNewsReleaseOrigins() {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'news-release-origins'],
    queryFn: () => fetchNewsReleaseOrigins(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useActivitiesForLookup(
  params?: Pick<LookupQueryParams, 'userId' | 'role'>
) {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'activities', params],
    queryFn: () => fetchActivitiesForLookup(params),
    staleTime: DYNAMIC_LOOKUP_CACHE_MS,
  });
}

export function useReports() {
  return useQuery<ReportResponse[]>({
    queryKey: ['reports'],
    queryFn: () => fetchReports(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useDateStatuses() {
  return useQuery<DateStatusLookupItem[]>({
    queryKey: ['lookups', 'date-statuses'],
    queryFn: () => fetchDateStatuses(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useTimeStatuses() {
  return useQuery<TimeStatusLookupItem[]>({
    queryKey: ['lookups', 'time-statuses'],
    queryFn: () => fetchTimeStatuses(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useVenueStatuses() {
  return useQuery<VenueStatusLookupItem[]>({
    queryKey: ['lookups', 'venue-statuses'],
    queryFn: () => fetchVenueStatuses(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function usePitchRequiredStatuses() {
  return useQuery<PitchRequiredStatusLookupItem[]>({
    queryKey: ['lookups', 'pitch-required-statuses'],
    queryFn: () => fetchPitchRequiredStatuses(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useTranslationRequiredStatuses() {
  return useQuery<TranslationRequiredStatusLookupItem[]>({
    queryKey: ['lookups', 'translation-required-statuses'],
    queryFn: () => fetchTranslationRequiredStatuses(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useMinistries() {
  return useQuery<MinistryLookupItem[]>({
    queryKey: ['lookups', 'ministries'],
    queryFn: () => fetchMinistries(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}
