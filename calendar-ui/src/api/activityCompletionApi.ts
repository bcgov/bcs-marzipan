import type { ActivityCompletionSettings } from '@corpcal/shared/schemas';

import api from './axios';

export type CompletionRunPreview = {
  count: number;
  items: Array<{ displayId: string | null; title: string }>;
  listTruncated: boolean;
};

export async function fetchCompletionSettings(): Promise<ActivityCompletionSettings> {
  const res = await api.get<{
    success: boolean;
    data: ActivityCompletionSettings;
  }>('/settings/activity-completion');
  return res.data.data;
}

export async function patchCompletionSettings(
  body: ActivityCompletionSettings
): Promise<ActivityCompletionSettings> {
  const res = await api.patch<{
    success: boolean;
    data: ActivityCompletionSettings;
  }>('/settings/activity-completion', body);
  return res.data.data;
}

export async function runCompletionJobNow(): Promise<{
  updated: number;
  skipped: boolean;
}> {
  const res = await api.post<{
    success: boolean;
    data: { updated: number; skipped: boolean };
  }>('/settings/activity-completion/run');
  return res.data.data;
}

export async function fetchCompletionRunPreview(): Promise<CompletionRunPreview> {
  const res = await api.get<{
    success: boolean;
    data: CompletionRunPreview;
  }>('/settings/activity-completion/run-preview');
  return res.data.data;
}
