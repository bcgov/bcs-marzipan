import type { LookAheadResetBatchRunResult } from '@corpcal/shared';

import api from './axios';

export type LookAheadResetSettings = {
  windowDaysAfterToday: number;
};

export type LookAheadResetRunPreview = {
  count: number;
  items: Array<{ displayId: string | null; title: string }>;
  listTruncated: boolean;
};

export async function fetchLookAheadResetSettings(): Promise<LookAheadResetSettings> {
  const res = await api.get<{
    success: boolean;
    data: LookAheadResetSettings;
  }>('/settings/look-ahead-reset');
  return res.data.data;
}

export async function patchLookAheadResetSettings(
  body: LookAheadResetSettings
): Promise<LookAheadResetSettings> {
  const res = await api.patch<{
    success: boolean;
    data: LookAheadResetSettings;
  }>('/settings/look-ahead-reset', body);
  return res.data.data;
}

export async function fetchLookAheadResetRunPreview(
  days?: number
): Promise<LookAheadResetRunPreview> {
  const res = await api.get<{
    success: boolean;
    data: LookAheadResetRunPreview;
  }>('/settings/look-ahead-reset/run-preview', {
    params: days === undefined ? undefined : { days },
  });
  return res.data.data;
}

export async function runLookAheadResetNow(body: {
  days?: number;
}): Promise<LookAheadResetBatchRunResult> {
  const res = await api.post<{
    success: boolean;
    data: LookAheadResetBatchRunResult;
  }>('/settings/look-ahead-reset/run', body);
  return res.data.data;
}
