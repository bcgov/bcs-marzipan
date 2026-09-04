import type {
  ActivityHistoryEntry,
  ActivityListItem,
  ActivityResponse,
  GlobalActivityHistoryEntry,
} from '@corpcal/shared/api/types';
import {
  serializeFilterActivitiesQueryParams,
  type AddActivityHistoryNoteRequest,
  type BulkUpdateActivitiesRequest,
  type CloneActivityRequest,
  type CreateActivityRequest,
  type FilterActivitiesQueryParams,
  type RequestDeleteRequest,
  type RestoreRequest,
  type SoftDeleteRequest,
  type UpdateActivityRequest,
} from '@corpcal/shared/schemas';

import { createLogger } from '../lib/logger';
import api from './axios';

const logger = createLogger('ActivitiesAPI');

// NOTE: previous client-side normalization was removed — backend now provides canonical shape

export async function fetchActivities(
  filters?: Partial<FilterActivitiesQueryParams>
): Promise<ActivityListItem[]> {
  const params = serializeFilterActivitiesQueryParams(filters);
  const res = await api.get<{ success: boolean; data: ActivityListItem[] }>(
    '/activities',
    {
      params,
    }
  );
  // Handle different response structures
  if (res.data && res.data.data) {
    return res.data.data;
  }

  // If the response is directly an array
  if (Array.isArray(res.data)) {
    return res.data;
  }

  logger.error('Unexpected API response structure');
  return [];
}

export async function fetchActivity(id: number): Promise<ActivityResponse> {
  const res = await api.get<{ success: boolean; data: ActivityResponse }>(
    `/activities/${id}`
  );
  return res.data.data;
}

export async function createActivity(
  activity: CreateActivityRequest
): Promise<ActivityResponse> {
  const url = api.defaults.baseURL + '/activities';
  logger.debug('Creating activity', { url, payload: activity });

  try {
    const res = await api.post<{ success: boolean; data: ActivityResponse }>(
      '/activities',
      activity
    );
    logger.debug('Activity created successfully', { data: res.data });
    return res.data.data;
  } catch (error) {
    logger.error('Failed to create activity', error);
    throw error;
  }
}

export async function cloneActivity(
  sourceId: number,
  body: CloneActivityRequest
): Promise<ActivityResponse> {
  const res = await api.post<{ success: boolean; data: ActivityResponse }>(
    `/activities/${sourceId}/clone`,
    body
  );
  return res.data.data;
}

export async function updateActivity(
  id: number,
  activity: UpdateActivityRequest
): Promise<ActivityResponse> {
  const res = await api.patch<{ success: boolean; data: ActivityResponse }>(
    `/activities/${id}`,
    activity,
    {
      timeout: 20_000,
    }
  );
  return res.data.data;
}

export async function bulkUpdateActivities(
  body: BulkUpdateActivitiesRequest
): Promise<ActivityResponse[]> {
  const res = await api.post<{ success: boolean; data: ActivityResponse[] }>(
    '/activities/bulk-update',
    body,
    { timeout: 30_000 }
  );
  return res.data.data;
}

export async function deleteActivity(
  id: number,
  body?: { reason?: string }
): Promise<void> {
  await api.delete(`/activities/${id}`, body ? { data: body } : undefined);
}

export async function requestDeleteActivity(
  id: number,
  body: RequestDeleteRequest
): Promise<ActivityResponse> {
  const res = await api.post<{ success: boolean; data: ActivityResponse }>(
    `/activities/${id}/request-delete`,
    body
  );
  return res.data.data;
}

export async function restoreActivity(
  id: number,
  body?: RestoreRequest
): Promise<ActivityResponse> {
  const res = await api.post<{ success: boolean; data: ActivityResponse }>(
    `/activities/${id}/restore`,
    body ?? {}
  );
  return res.data.data;
}

export async function softDeleteActivity(
  id: number,
  body: SoftDeleteRequest
): Promise<ActivityResponse> {
  const res = await api.delete<{ success: boolean; data: ActivityResponse }>(
    `/activities/${id}/soft-delete`,
    { data: body }
  );
  return res.data.data;
}

export async function fetchActivityHistory(
  id: number
): Promise<ActivityHistoryEntry[]> {
  const res = await api.get<{
    success: boolean;
    data: ActivityHistoryEntry[];
  }>(`/activities/${id}/history`);
  if (res.data && res.data.data) return res.data.data;
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchGlobalActivityHistory(): Promise<
  GlobalActivityHistoryEntry[]
> {
  const res = await api.get<{
    success: boolean;
    data: GlobalActivityHistoryEntry[];
  }>('/activities/global-history');
  if (res.data && res.data.data) return res.data.data;
  return Array.isArray(res.data) ? res.data : [];
}

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  hasNext: boolean;
  totalItems?: number;
};

export async function fetchGlobalActivityHistoryPaged(params?: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  query?: string;
  order?: 'asc' | 'desc';
  userId?: number;
  userIds?: number[];
  actionTypes?: string[];
  categories?: string[];
  leadTeamIds?: number[];
}): Promise<PagedResult<GlobalActivityHistoryEntry>> {
  const serializedParams: Record<string, string | number | undefined> = {};
  if (params == null) {
    const res = await api.get('/activities/global-history', { params: {} });
    return normalizeGlobalHistoryPagedResponse(res.data);
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      serializedParams[key] = value.join(',');
    } else {
      serializedParams[key] = value;
    }
  }

  const res = await api.get('/activities/global-history', {
    params: serializedParams,
  });
  return normalizeGlobalHistoryPagedResponse(res.data);
}

function normalizeGlobalHistoryPagedResponse(
  data: unknown
): PagedResult<GlobalActivityHistoryEntry> {
  if (data && typeof data === 'object') {
    if ('items' in data && Array.isArray(data.items)) {
      return data as PagedResult<GlobalActivityHistoryEntry>;
    }

    if (
      'data' in data &&
      data.data &&
      typeof data.data === 'object' &&
      'items' in data.data
    ) {
      return data.data as PagedResult<GlobalActivityHistoryEntry>;
    }
  }

  const items = Array.isArray(data)
    ? data
    : data &&
        typeof data === 'object' &&
        'data' in data &&
        Array.isArray(data.data)
      ? data.data
      : [];
  return {
    items,
    page: 1,
    pageSize: Array.isArray(items) ? items.length : 0,
    hasNext: false,
  };
}

export async function addActivityHistoryNote(
  id: number,
  body: AddActivityHistoryNoteRequest
): Promise<ActivityHistoryEntry> {
  const res = await api.post<{
    success: boolean;
    data: ActivityHistoryEntry;
  }>(`/activities/${id}/history/notes`, body);
  return res.data.data;
}
