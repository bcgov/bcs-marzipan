import api from './axios.js';
import type {
  LookupItem,
  LookupQueryParams,
  CategoryLookupItem,
  OrganizationLookupItem,
  UserLookupItem,
  TagLookupItem,
  PitchStatusLookupItem,
  ActivityStatusLookupItem,
  CommsMaterialsLookupItem,
  TranslationLanguageLookupItem,
  GovernmentRepresentativeLookupItem,
  ReportResponse,
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
  ActivityStatusLookupItem,
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
  // Convert userIds array to comma-separated string for API
  const apiParams = params
    ? {
        ...params,
        userIds: params.userIds?.join(','),
      }
    : undefined;

  const res = await api.get<{ success: boolean; data: UserLookupItem[] }>(
    '/lookups/users',
    {
      params: apiParams,
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

export async function fetchActivityStatuses(): Promise<
  ActivityStatusLookupItem[]
> {
  const res = await api.get<{
    success: boolean;
    data: ActivityStatusLookupItem[];
  }>('/lookups/activity-statuses');
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

export async function fetchEventPlanners(): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/event-planners'
  );
  return res.data.data;
}

export async function fetchNewsReleaseDistributions(): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/news-release-distributions'
  );
  return res.data.data;
}

export async function fetchPremierRequested(): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/premier-requested'
  );
  return res.data.data;
}

export async function fetchNewsReleaseOrigins(): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/news-release-origins'
  );
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

export async function fetchReports(): Promise<ReportResponse[]> {
  const res = await api.get<ReportResponse[]>('/reports');
  return res.data;
}
