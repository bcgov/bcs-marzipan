import type { ActivityInfoIconSettings } from '@corpcal/shared/schemas';

import api from './axios';

export async function fetchActivityInfoIconSettings(): Promise<ActivityInfoIconSettings> {
  const res = await api.get<{
    success: boolean;
    data: ActivityInfoIconSettings;
  }>('/settings/activity-info-icons');
  return res.data.data;
}

export async function patchActivityInfoIconSettings(
  body: ActivityInfoIconSettings
): Promise<ActivityInfoIconSettings> {
  const res = await api.patch<{
    success: boolean;
    data: ActivityInfoIconSettings;
  }>('/settings/activity-info-icons', body);
  return res.data.data;
}
