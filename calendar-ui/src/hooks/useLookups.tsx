import { useQuery } from '@tanstack/react-query';

import {
  DYNAMIC_LOOKUP_CACHE_MS,
  REFERENCE_LOOKUP_CACHE_MS,
} from '@corpcal/shared';
import type {
  DateStatusLookupItem,
  PitchRequiredStatusLookupItem,
  ReportResponse,
  TimeStatusLookupItem,
  TranslationRequiredStatusLookupItem,
  VenueStatusLookupItem,
} from '@corpcal/shared/api/types';

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
import { lookupQueryKeys } from '../lib/lookupQueryKeys';

type TeamLookupItem = Awaited<ReturnType<typeof fetchTeams>>[number];

export function useCategories() {
  return useQuery<CategoryLookupItem[]>({
    queryKey: lookupQueryKeys.categories(),
    queryFn: () => fetchCategories(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useOrganizations(params?: LookupQueryParams) {
  return useQuery<OrganizationLookupItem[]>({
    queryKey: lookupQueryKeys.organizations(params),
    queryFn: () => fetchOrganizations(params),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useUsers(params?: LookupQueryParams) {
  return useQuery<UserLookupItem[]>({
    queryKey: lookupQueryKeys.users(params),
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
    queryKey: lookupQueryKeys.tags(),
    queryFn: () => fetchTags(),
    staleTime: DYNAMIC_LOOKUP_CACHE_MS, // user-specific results; don't cache as long as static lookups
  });
}

export function usePitchStatuses() {
  return useQuery<PitchStatusLookupItem[]>({
    queryKey: lookupQueryKeys.pitchStatuses(),
    queryFn: () => fetchPitchStatuses(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useActivityStatuses() {
  return useQuery<ActivityStatusLookupItem[]>({
    queryKey: lookupQueryKeys.activityStatuses(),
    queryFn: () => fetchActivityStatuses(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useCommsMaterials() {
  return useQuery<CommsMaterialsLookupItem[]>({
    queryKey: lookupQueryKeys.commsMaterials(),
    queryFn: () => fetchCommsMaterials(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useTranslationLanguages() {
  return useQuery<TranslationLanguageLookupItem[]>({
    queryKey: lookupQueryKeys.translationLanguages(),
    queryFn: () => fetchTranslationLanguages(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useGovernmentRepresentatives() {
  return useQuery<GovernmentRepresentativeLookupItem[]>({
    queryKey: lookupQueryKeys.governmentRepresentatives(),
    queryFn: () => fetchGovernmentRepresentatives(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useEventPlanners() {
  return useQuery<LookupItem[]>({
    queryKey: lookupQueryKeys.eventPlanners(),
    queryFn: () => fetchEventPlanners(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useNewsReleaseDistributions() {
  return useQuery<LookupItem[]>({
    queryKey: lookupQueryKeys.newsReleaseDistributions(),
    queryFn: () => fetchNewsReleaseDistributions(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function usePremierRequested() {
  return useQuery<LookupItem[]>({
    queryKey: lookupQueryKeys.premierRequested(),
    queryFn: () => fetchPremierRequested(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useNewsReleaseOrigins() {
  return useQuery<LookupItem[]>({
    queryKey: lookupQueryKeys.newsReleaseOrigins(),
    queryFn: () => fetchNewsReleaseOrigins(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useActivitiesForLookup(
  params?: Pick<LookupQueryParams, 'userId' | 'role'>
) {
  return useQuery<LookupItem[]>({
    queryKey: lookupQueryKeys.activities(params),
    queryFn: () => fetchActivitiesForLookup(params),
    staleTime: DYNAMIC_LOOKUP_CACHE_MS,
  });
}

export function useReports() {
  return useQuery<ReportResponse[]>({
    queryKey: lookupQueryKeys.reports(),
    queryFn: () => fetchReports(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useDateStatuses() {
  return useQuery<DateStatusLookupItem[]>({
    queryKey: lookupQueryKeys.dateStatuses(),
    queryFn: () => fetchDateStatuses(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useTimeStatuses() {
  return useQuery<TimeStatusLookupItem[]>({
    queryKey: lookupQueryKeys.timeStatuses(),
    queryFn: () => fetchTimeStatuses(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useVenueStatuses() {
  return useQuery<VenueStatusLookupItem[]>({
    queryKey: lookupQueryKeys.venueStatuses(),
    queryFn: () => fetchVenueStatuses(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function usePitchRequiredStatuses() {
  return useQuery<PitchRequiredStatusLookupItem[]>({
    queryKey: lookupQueryKeys.pitchRequiredStatuses(),
    queryFn: () => fetchPitchRequiredStatuses(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useTranslationRequiredStatuses() {
  return useQuery<TranslationRequiredStatusLookupItem[]>({
    queryKey: lookupQueryKeys.translationRequiredStatuses(),
    queryFn: () => fetchTranslationRequiredStatuses(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}

export function useMinistries() {
  return useQuery<MinistryLookupItem[]>({
    queryKey: lookupQueryKeys.ministries(),
    queryFn: () => fetchMinistries(),
    staleTime: REFERENCE_LOOKUP_CACHE_MS,
  });
}
