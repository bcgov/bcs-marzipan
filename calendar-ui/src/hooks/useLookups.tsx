import { useQuery } from '@tanstack/react-query';
import {
  fetchCategories,
  fetchOrganizations,
  fetchUsers,
  fetchTags,
  fetchPitchStatuses,
  fetchSchedulingStatuses,
  fetchCommsMaterials,
  fetchTranslationLanguages,
  fetchGovernmentRepresentatives,
  fetchActivitiesForLookup,
  type LookupItem,
  type LookupQueryParams,
} from '../api/lookupsApi';

// Small lookups (<20 items) - cache for 1 hour
const SMALL_LOOKUP_STALE_TIME = 3600000; // 1 hour

// Large lookups (users/orgs/activities) - cache for 5 minutes
const LARGE_LOOKUP_STALE_TIME = 300000; // 5 minutes

export function useCategories() {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'categories'],
    queryFn: () => fetchCategories(),
    staleTime: SMALL_LOOKUP_STALE_TIME,
  });
}

export function useOrganizations(params?: LookupQueryParams) {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'organizations', params],
    queryFn: () => fetchOrganizations(params),
    staleTime: LARGE_LOOKUP_STALE_TIME,
  });
}

export function useUsers(params?: LookupQueryParams) {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'users', params],
    queryFn: () => fetchUsers(params),
    staleTime: LARGE_LOOKUP_STALE_TIME,
  });
}

export function useTags() {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'tags'],
    queryFn: () => fetchTags(),
    staleTime: SMALL_LOOKUP_STALE_TIME,
  });
}

export function usePitchStatuses() {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'pitch-statuses'],
    queryFn: () => fetchPitchStatuses(),
    staleTime: SMALL_LOOKUP_STALE_TIME,
  });
}

export function useSchedulingStatuses() {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'scheduling-statuses'],
    queryFn: () => fetchSchedulingStatuses(),
    staleTime: SMALL_LOOKUP_STALE_TIME,
  });
}

export function useCommsMaterials() {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'comms-materials'],
    queryFn: () => fetchCommsMaterials(),
    staleTime: SMALL_LOOKUP_STALE_TIME,
  });
}

export function useTranslationLanguages() {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'translation-languages'],
    queryFn: () => fetchTranslationLanguages(),
    staleTime: SMALL_LOOKUP_STALE_TIME,
  });
}

export function useGovernmentRepresentatives() {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'government-representatives'],
    queryFn: () => fetchGovernmentRepresentatives(),
    staleTime: SMALL_LOOKUP_STALE_TIME,
  });
}

export function useActivitiesForLookup(
  params?: Pick<LookupQueryParams, 'userId' | 'role'>
) {
  return useQuery<LookupItem[]>({
    queryKey: ['lookups', 'activities', params],
    queryFn: () => fetchActivitiesForLookup(params),
    staleTime: LARGE_LOOKUP_STALE_TIME,
  });
}
