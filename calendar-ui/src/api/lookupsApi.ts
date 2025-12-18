import api from './axios.js';
import { createLogger } from '../lib/logger';

const logger = createLogger('LookupsAPI');

export interface LookupItem {
  id: string | number;
  label: string;
  value: string | number;
  [key: string]: unknown;
}

export interface LookupQueryParams {
  userId?: number;
  role?: string;
  organizationId?: string;
}

export async function fetchCategories(): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/categories'
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

export async function fetchTags(): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/tags'
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

export async function fetchCommsMaterials(): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/comms-materials'
  );
  return res.data.data;
}

export async function fetchTranslationLanguages(): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/translation-languages'
  );
  return res.data.data;
}

export async function fetchGovernmentRepresentatives(): Promise<LookupItem[]> {
  const res = await api.get<{ success: boolean; data: LookupItem[] }>(
    '/lookups/government-representatives'
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
