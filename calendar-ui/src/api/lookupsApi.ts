import api from './axios.js';
import type {
  LookupItem,
  LookupQueryParams,
  CategoryLookupItem,
  OrganizationLookupItem,
  UserLookupItem,
  TagLookupItem,
  PitchStatusLookupItem,
  CommsMaterialsLookupItem,
  TranslationLanguageLookupItem,
  GovernmentRepresentativeLookupItem,
} from '@corpcal/shared/api/types';

// Re-export types for components that import from this file
export type {
  LookupItem,
  LookupQueryParams,
  CategoryLookupItem,
  OrganizationLookupItem,
  UserLookupItem,
  TagLookupItem,
  PitchStatusLookupItem,
  CommsMaterialsLookupItem,
  TranslationLanguageLookupItem,
  GovernmentRepresentativeLookupItem,
};

export async function fetchCategories(): Promise<CategoryLookupItem[]> {
  const res = await api.get<{ success: boolean; data: CategoryLookupItem[] }>(
    '/lookups/categories'
  );
  return res.data.data;
}

export async function fetchOrganizations(
  params?: LookupQueryParams
): Promise<OrganizationLookupItem[]> {
  const res = await api.get<{
    success: boolean;
    data: OrganizationLookupItem[];
  }>('/lookups/organizations', {
    params,
  });
  return res.data.data;
}

export async function fetchUsers(
  params?: LookupQueryParams
): Promise<UserLookupItem[]> {
  const res = await api.get<{ success: boolean; data: UserLookupItem[] }>(
    '/lookups/users',
    {
      params,
    }
  );
  return res.data.data;
}

export async function fetchTags(): Promise<TagLookupItem[]> {
  const res = await api.get<{ success: boolean; data: TagLookupItem[] }>(
    '/lookups/tags'
  );
  return res.data.data;
}

export async function fetchActivityStatuses(): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/activity-statuses'
  );
  return res.data.data;
}

export async function fetchPitchStatuses(): Promise<PitchStatusLookupItem[]> {
  const res = await api.get<{
    success: boolean;
    data: PitchStatusLookupItem[];
  }>('/lookups/pitch-statuses');
  return res.data.data;
}

export async function fetchCommsMaterials(): Promise<
  CommsMaterialsLookupItem[]
> {
  const res = await api.get<{
    success: boolean;
    data: CommsMaterialsLookupItem[];
  }>('/lookups/comms-materials');
  return res.data.data;
}

export async function fetchTranslationLanguages(): Promise<
  TranslationLanguageLookupItem[]
> {
  const res = await api.get<{
    success: boolean;
    data: TranslationLanguageLookupItem[];
  }>('/lookups/translation-languages');
  return res.data.data;
}

export async function fetchGovernmentRepresentatives(): Promise<
  GovernmentRepresentativeLookupItem[]
> {
  const res = await api.get<{
    success: boolean;
    data: GovernmentRepresentativeLookupItem[];
  }>('/lookups/government-representatives');
  return res.data.data;
}

export async function fetchActivitiesForLookup(
  params?: Pick<LookupQueryParams, 'userId' | 'role'>
): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/activities',
    {
      params,
    }
  );
  return res.data.data;
}
