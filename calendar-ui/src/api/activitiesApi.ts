import api from './axios';
import type { ActivityResponse } from '@corpcal/shared/api/types';
import type {
  CreateActivityRequest,
  UpdateActivityRequest,
  FilterActivitiesQueryParams,
} from '@corpcal/shared/schemas';
import { createLogger } from '../lib/logger';

const logger = createLogger('ActivitiesAPI');

// NOTE: previous client-side normalization was removed — backend now provides canonical shape

export async function fetchActivities(
  filters?: FilterActivitiesQueryParams
): Promise<ActivityResponse[]> {
  const res = await api.get<{ success: boolean; data: ActivityResponse[] }>(
    '/activities',
    {
      params: filters,
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

  console.error('Unexpected API response structure:', res.data);
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
    activity
  );
  return res.data.data;
}

export async function deleteActivity(id: number): Promise<void> {
  await api.delete(`/activities/${id}`);
}

export async function fetchActivityHistory(id: number): Promise<
  {
    id: number;
    activityId: number;
    userId: number;
    actionType: string;
    changes: Array<{
      field: string;
      oldValue: unknown;
      newValue: unknown;
    }> | null;
    notes: string | null;
    timestamp: string;
    userName?: string;
  }[]
> {
  const res = await api.get<{ success: boolean; data: any }>(
    `/activities/${id}/history`
  );
  if (res.data && res.data.data) return res.data.data;
  return Array.isArray(res.data) ? res.data : [];
}
