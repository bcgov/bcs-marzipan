import type {
  ActivityStatusLookupItem,
  CategoryLookupItem,
  CityLookupItem,
  CommsMaterialsLookupItem,
  DateStatusLookupItem,
  GovernmentRepresentativeLookupItem,
  LookupItem,
  MinistryGroupResponse,
  MinistryLookupItem,
  OrganizationLookupItem,
  PitchRequiredStatusLookupItem,
  PitchStatusLookupItem,
  ReportResponse,
  TagLookupItem,
  ThemeLookupItem,
  TimeStatusLookupItem,
  TranslationLanguageLookupItem,
  TranslationRequiredStatusLookupItem,
  UserLookupItem,
  VenuePresetItem,
  VenueStatusLookupItem,
} from '@corpcal/shared/api/types';
import type {
  CreateActivityStatusRequest,
  CreateCategoryRequest,
  CreateCityRequest,
  CreateCommsMaterialRequest,
  CreateGovernmentRepresentativeRequest,
  CreateMinistryGroupRequest,
  CreateMinistryRequest,
  CreateTagRequest,
  CreateThemeRequest,
  CreateVenuePresetRequest,
  UpdateActivityStatusRequest,
  UpdateCategoryRequest,
  UpdateCityRequest,
  UpdateCommsMaterialRequest,
  UpdateGovernmentRepresentativeRequest,
  UpdateMinistryGroupRequest,
  UpdateMinistryRequest,
  UpdateTagRequest,
  UpdateThemeRequest,
  UpdateVenuePresetRequest,
} from '@corpcal/shared/schemas';

import api from './axios';

export interface LookupQueryParams {
  userId?: number;
  role?: string;
  organizationId?: number;
  userIds?: number[];
}

export async function fetchCategories(): Promise<CategoryLookupItem[]> {
  const res = await api.get<{ success: boolean; data: CategoryLookupItem[] }>(
    '/lookups/categories'
  );
  return res.data.data;
}

export async function fetchAllCategories(): Promise<CategoryLookupItem[]> {
  const res = await api.get<{ success: boolean; data: CategoryLookupItem[] }>(
    '/lookups/categories',
    { params: { includeAll: 'true' } }
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

export async function fetchAllTags(): Promise<TagLookupItem[]> {
  const res = await api.get<{ success: boolean; data: TagLookupItem[] }>(
    '/lookups/tags',
    { params: { includeAll: 'true' } }
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

export async function fetchDateStatuses(): Promise<DateStatusLookupItem[]> {
  const res = await api.get<{
    success: boolean;
    data: DateStatusLookupItem[];
  }>('/lookups/date-statuses');
  return res.data.data;
}

export async function fetchTimeStatuses(): Promise<TimeStatusLookupItem[]> {
  const res = await api.get<{
    success: boolean;
    data: TimeStatusLookupItem[];
  }>('/lookups/time-statuses');
  return res.data.data;
}

export async function fetchVenueStatuses(): Promise<VenueStatusLookupItem[]> {
  const res = await api.get<{
    success: boolean;
    data: VenueStatusLookupItem[];
  }>('/lookups/venue-statuses');
  return res.data.data;
}

export async function fetchPitchRequiredStatuses(): Promise<
  PitchRequiredStatusLookupItem[]
> {
  const res = await api.get<{
    success: boolean;
    data: PitchRequiredStatusLookupItem[];
  }>('/lookups/pitch-required-statuses');
  return res.data.data;
}

export async function fetchTranslationRequiredStatuses(): Promise<
  TranslationRequiredStatusLookupItem[]
> {
  const res = await api.get<{
    success: boolean;
    data: TranslationRequiredStatusLookupItem[];
  }>('/lookups/translation-required-statuses');
  return res.data.data;
}

export async function fetchCities(): Promise<CityLookupItem[]> {
  const res = await api.get<{ success: boolean; data: CityLookupItem[] }>(
    '/lookups/cities'
  );
  return res.data.data;
}

export async function fetchMinistries(): Promise<MinistryLookupItem[]> {
  const res = await api.get<{
    success: boolean;
    data: MinistryLookupItem[];
  }>('/lookups/ministries');
  return res.data.data;
}

/** Ministry shortcut groups (admin); includes displayName for GenericLookupAdmin table. */
export type MinistryGroupListItem = MinistryGroupResponse & {
  displayName: string;
  isActive: boolean;
};

export async function fetchMinistryGroups(): Promise<MinistryGroupListItem[]> {
  const res = await api.get<{
    success: boolean;
    data: MinistryGroupResponse[];
  }>('/lookups/ministry-groups');
  return res.data.data.map((g) => ({
    ...g,
    displayName: g.name,
    isActive: true,
  }));
}

export async function fetchThemes(): Promise<ThemeLookupItem[]> {
  const res = await api.get<{ success: boolean; data: ThemeLookupItem[] }>(
    '/lookups/themes'
  );
  return res.data.data;
}

export async function fetchVenuePresets(): Promise<VenuePresetItem[]> {
  const res = await api.get<{
    success: boolean;
    data: VenuePresetItem[];
  }>('/lookups/venue-presets');
  return res.data.data;
}

// ============================================
// Admin CRUD Functions
// ============================================

// Categories
export async function createCategory(
  data: CreateCategoryRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.post<{ success: boolean; data: any }>(
    '/lookups/categories',
    data
  );
  return res.data;
}

export async function updateCategory(
  id: number,
  data: UpdateCategoryRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.patch<{ success: boolean; data: any }>(
    `/lookups/categories/${id}`,
    data
  );
  return res.data;
}

// Tags
export async function createTag(
  data: CreateTagRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.post<{ success: boolean; data: any }>(
    '/lookups/tags',
    data
  );
  return res.data;
}

export async function updateTag(
  id: string | number,
  data: UpdateTagRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.patch<{ success: boolean; data: any }>(
    `/lookups/tags/${id}`,
    data
  );
  return res.data;
}

// Venue presets
export async function createVenuePreset(
  data: CreateVenuePresetRequest
): Promise<{ success: boolean; data: VenuePresetItem }> {
  const res = await api.post<{ success: boolean; data: VenuePresetItem }>(
    '/lookups/venue-presets',
    data
  );
  return res.data;
}

export async function updateVenuePreset(
  id: number,
  data: UpdateVenuePresetRequest
): Promise<{ success: boolean; data: VenuePresetItem }> {
  const res = await api.patch<{ success: boolean; data: VenuePresetItem }>(
    `/lookups/venue-presets/${id}`,
    data
  );
  return res.data;
}

export async function deleteVenuePreset(
  id: number
): Promise<{ success: boolean }> {
  const res = await api.delete<{ success: boolean }>(
    `/lookups/venue-presets/${id}`
  );
  return res.data;
}

// Cities
export async function createCity(
  data: CreateCityRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.post<{ success: boolean; data: any }>(
    '/lookups/cities',
    data
  );
  return res.data;
}

export async function updateCity(
  id: number,
  data: UpdateCityRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.patch<{ success: boolean; data: any }>(
    `/lookups/cities/${id}`,
    data
  );
  return res.data;
}

// Permissions admin
export async function fetchAllPermissions(): Promise<
  {
    id: number;
    key: string;
    displayName: string;
    description: string | null;
    showInUserManagement: boolean;
  }[]
> {
  const res = await api.get<{ success: boolean; data: any[] }>(
    `/lookups/permissions`
  );
  return res.data.data;
}

export async function fetchRolesPermissionsMap(): Promise<
  Record<number, any[]>
> {
  const res = await api.get<{ success: boolean; data: Record<number, any[]> }>(
    `/lookups/roles/permissions`
  );
  return res.data.data;
}

export async function updatePermissionVisibility(
  id: number,
  showInUserManagement: boolean
): Promise<{
  success: boolean;
  data: { id: number; key: string; showInUserManagement: boolean };
}> {
  const res = await api.patch(`/lookups/permissions/${id}/visibility`, {
    showInUserManagement,
  });
  return res.data;
}

// Ministries
export async function createMinistry(
  data: CreateMinistryRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.post<{ success: boolean; data: any }>(
    '/lookups/ministries',
    data
  );
  return res.data;
}

export async function updateMinistry(
  id: string,
  data: UpdateMinistryRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.patch<{ success: boolean; data: any }>(
    `/lookups/ministries/${id}`,
    data
  );
  return res.data;
}

export async function createMinistryGroup(
  data: CreateMinistryGroupRequest
): Promise<{ success: boolean; data: MinistryGroupResponse }> {
  const res = await api.post<{
    success: boolean;
    data: MinistryGroupResponse;
  }>('/lookups/ministry-groups', data);
  return res.data;
}

export async function updateMinistryGroup(
  id: number,
  data: UpdateMinistryGroupRequest
): Promise<{ success: boolean; data: MinistryGroupResponse }> {
  const res = await api.patch<{
    success: boolean;
    data: MinistryGroupResponse;
  }>(`/lookups/ministry-groups/${id}`, data);
  return res.data;
}

export async function deleteMinistryGroup(
  id: number
): Promise<{ success: boolean }> {
  const res = await api.delete<{ success: boolean }>(
    `/lookups/ministry-groups/${id}`
  );
  return res.data;
}

// Comms Materials
export async function createCommsMaterial(
  data: CreateCommsMaterialRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.post<{ success: boolean; data: any }>(
    '/lookups/comms-materials',
    data
  );
  return res.data;
}

export async function updateCommsMaterial(
  id: number,
  data: UpdateCommsMaterialRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.patch<{ success: boolean; data: any }>(
    `/lookups/comms-materials/${id}`,
    data
  );
  return res.data;
}

// Government Representatives
export async function createGovernmentRepresentative(
  data: CreateGovernmentRepresentativeRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.post<{ success: boolean; data: any }>(
    '/lookups/government-representatives',
    data
  );
  return res.data;
}

export async function updateGovernmentRepresentative(
  id: number,
  data: UpdateGovernmentRepresentativeRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.patch<{ success: boolean; data: any }>(
    `/lookups/government-representatives/${id}`,
    data
  );
  return res.data;
}

// Themes
export async function createTheme(
  data: CreateThemeRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.post<{ success: boolean; data: any }>(
    '/lookups/themes',
    data
  );
  return res.data;
}

export async function updateTheme(
  id: string,
  data: UpdateThemeRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.patch<{ success: boolean; data: any }>(
    `/lookups/themes/${id}`,
    data
  );
  return res.data;
}

// Activity Statuses
export async function createActivityStatus(
  data: CreateActivityStatusRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.post<{ success: boolean; data: any }>(
    '/lookups/activity-statuses',
    data
  );
  return res.data;
}

export async function updateActivityStatus(
  id: number,
  data: UpdateActivityStatusRequest
): Promise<{ success: boolean; data: any }> {
  const res = await api.patch<{ success: boolean; data: any }>(
    `/lookups/activity-statuses/${id}`,
    data
  );
  return res.data;
}

// Reports
export async function fetchReports(): Promise<ReportResponse[]> {
  const res = await api.get<{ success: boolean; data: ReportResponse[] }>(
    '/lookups/reports'
  );
  return res.data.data;
}

// Export types for use in other files
export type {
  CategoryLookupItem,
  OrganizationLookupItem,
  UserLookupItem,
  TagLookupItem,
  PitchStatusLookupItem,
  ActivityStatusLookupItem,
  CommsMaterialsLookupItem,
  TranslationLanguageLookupItem,
  GovernmentRepresentativeLookupItem,
  LookupItem,
  MinistryLookupItem,
  ThemeLookupItem,
  VenuePresetItem,
};
