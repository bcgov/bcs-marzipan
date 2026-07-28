import {
  activityInfoIconSettingsSchema,
  type ActivityInfoIconSettings,
} from '@corpcal/shared/schemas';

import api from './axios';
import { ApiError } from './errors';

const ACTIVITY_INFO_ICON_SETTINGS_CACHE_KEY =
  'corpcal.activityInfoIconSettings.v1';

function canUseLocalStorage(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

export function readCachedActivityInfoIconSettings(): ActivityInfoIconSettings | null {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(
      ACTIVITY_INFO_ICON_SETTINGS_CACHE_KEY
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const result = activityInfoIconSettingsSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function writeCachedActivityInfoIconSettings(
  settings: ActivityInfoIconSettings
): void {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(
      ACTIVITY_INFO_ICON_SETTINGS_CACHE_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // Ignore storage errors.
  }
}

export function shouldRetryActivityInfoIconSettings(
  failureCount: number,
  error: unknown
): boolean {
  if (failureCount >= 3) return false;
  if (error instanceof ApiError) {
    return error.status === 429;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: unknown }).status === 429
  ) {
    return true;
  }
  return false;
}

export function activityInfoIconSettingsRetryDelay(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 8000);
}

export async function fetchActivityInfoIconSettings(): Promise<ActivityInfoIconSettings> {
  const res = await api.get<{
    success: boolean;
    data: ActivityInfoIconSettings;
  }>('/settings/activity-info-icons');
  writeCachedActivityInfoIconSettings(res.data.data);
  return res.data.data;
}

export async function patchActivityInfoIconSettings(
  body: ActivityInfoIconSettings
): Promise<ActivityInfoIconSettings> {
  const res = await api.patch<{
    success: boolean;
    data: ActivityInfoIconSettings;
  }>('/settings/activity-info-icons', body);
  writeCachedActivityInfoIconSettings(res.data.data);
  return res.data.data;
}
