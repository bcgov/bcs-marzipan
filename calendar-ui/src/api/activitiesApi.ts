import api from './axios.js';
import type { ActivityResponse } from '@corpcal/shared/api/types';
import type {
  CreateActivityRequest,
  UpdateActivityRequest,
  FilterActivities,
} from '@corpcal/shared/schemas';

export async function fetchActivities(
  filters?: FilterActivities
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
  const res = await api.post<{ success: boolean; data: ActivityResponse }>(
    '/activities',
    activity
  );
  return res.data.data;
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
