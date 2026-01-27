import { useQuery } from '@tanstack/react-query';
import {
  REFERENCE_LOOKUP_CACHE_MS,
  DYNAMIC_LOOKUP_CACHE_MS,
} from '@corpcal/shared';
import {
  fetchCategories,
  fetchOrganizations,
  fetchUsers,
  fetchTags,
  fetchPitchStatuses,
  fetchActivityStatuses,
  fetchCommsMaterials,
  fetchTranslationLanguages,
  fetchGovernmentRepresentatives,
  fetchEventPlanners,
  fetchNewsReleaseDistributions,
  fetchPremierRequested,
  fetchNewsReleaseOrigins,
  fetchActivitiesForLookup,
  fetchReports,
  fetchDateStatuses,
  fetchTimeStatuses,
  fetchMinistries,
  type LookupItem,
  type LookupQueryParams,
  type CategoryLookupItem,
  type OrganizationLookupItem,
  type UserLookupItem,
  type TagLookupItem,
  type PitchStatusLookupItem,
  type ActivityStatusLookupItem,
  type CommsMaterialsLookupItem,
  type TranslationLanguageLookupItem,
  type GovernmentRepresentativeLookupItem,
  type MinistryLookupItem,
} from '../api/lookupsApi';
import type { ReportResponse } from '@corpcal/shared/api/types';

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
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'date-statuses'],
    queryFn: () => fetchDateStatuses(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useTimeStatuses() {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'time-statuses'],
    queryFn: () => fetchTimeStatuses(),
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
