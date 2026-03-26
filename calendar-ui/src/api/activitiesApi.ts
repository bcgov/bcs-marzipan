import type {
  ActivityHistoryEntry,
  ActivityResponse,
  GlobalActivityHistoryEntry,
} from '@corpcal/shared/api/types';
import type {
  AddActivityHistoryNoteRequest,
  CreateActivityRequest,
  FilterActivitiesQueryParams,
  RequestDeleteRequest,
  RestoreRequest,
  SoftDeleteRequest,
  UpdateActivityRequest,
} from '@corpcal/shared/schemas';

import { createLogger } from '../lib/logger';
import api from './axios';

const logger = createLogger('ActivitiesAPI');

// NOTE: previous client-side normalization was removed — backend now provides canonical shape

export async function fetchActivities(
  filters?: Partial<FilterActivitiesQueryParams>
): Promise<ActivityResponse[]> {
  const params =
    filters?.sharedWithTeamIds != null && filters.sharedWithTeamIds.length > 0
      ? {
          ...filters,
          sharedWithTeamIds: filters.sharedWithTeamIds.join(','),
        }
      : filters;
  const res = await api.get<{ success: boolean; data: ActivityResponse[] }>(
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
