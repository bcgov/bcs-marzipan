import api from './axios.js';

export interface LookupItem {
  id: string | number;
  label: string;
  value: string | number;
  sortOrder?: number;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface LookupQueryParams {
  userId?: number;
  role?: string;
  organizationId?: string;
}

export async function fetchCategories(includeInactive = false): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/categories',
    {
      params: includeInactive ? { includeInactive: 'true' } : {},
    }
  );
  return res.data.data;
}

export async function fetchOrganizations(
  params?: LookupQueryParams
): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/organizations',
    {
      params,
    }
  );
  return res.data.data;
}

export async function fetchUsers(
  params?: LookupQueryParams
): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/users',
    {
      params,
    }
  );
  return res.data.data;
}

export async function fetchTags(includeInactive = false): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/tags',
    {
      params: includeInactive ? { includeInactive: 'true' } : {},
    }
  );
  return res.data.data;
}

export async function fetchPitchStatuses(): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/pitch-statuses'
  );
  return res.data.data;
}

export async function fetchSchedulingStatuses(): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/scheduling-statuses'
  );
  return res.data.data;
}

export async function fetchCommsMaterials(includeInactive = false): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/comms-materials',
    {
      params: includeInactive ? { includeInactive: 'true' } : {},
    }
  );
  return res.data.data;
}

export async function fetchTranslationLanguages(): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/translation-languages'
  );
  return res.data.data;
}

export async function fetchGovernmentRepresentatives(includeInactive = false): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/government-representatives',
    {
      params: includeInactive ? { includeInactive: 'true' } : {},
    }
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

export async function fetchCities(includeInactive = false): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/cities',
    {
      params: includeInactive ? { includeInactive: 'true' } : {},
    }
  );
  return res.data.data;
}

export async function fetchMinistries(includeInactive = false): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/ministries',
    {
      params: includeInactive ? { includeInactive: 'true' } : {},
    }
  );
  return res.data.data;
}

export async function fetchThemes(includeInactive = false): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/themes',
    {
      params: includeInactive ? { includeInactive: 'true' } : {},
    }
  );
  return res.data.data;
}

export async function fetchActivityStatuses(includeInactive = false): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/activity-statuses',
    {
      params: includeInactive ? { includeInactive: 'true' } : {},
    }
  );
  return res.data.data;
}
