import type {
  LookAheadResetBatchRunResult,
  LookAheadResetRollbackResult,
} from '@corpcal/shared';
import type {
  LookAheadResetManualRunBody,
  LookAheadResetSettings,
} from '@corpcal/shared/schemas';

import api from './axios';

export type { LookAheadResetManualRunBody, LookAheadResetSettings };

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

export async function patchLookAheadResetSettings(body: {
  windowDaysAfterToday?: number;
  cronMode?: LookAheadResetSettings['cronMode'];
}): Promise<LookAheadResetSettings> {
  const res = await api.patch<{
    success: boolean;
    data: LookAheadResetSettings;
  }>('/settings/look-ahead-reset', body);
  return res.data.data;
}

export async function fetchLookAheadResetRunPreview(params: {
  scope?: LookAheadResetManualRunBody['scope'];
  days?: number;
  includePast?: boolean;
}): Promise<LookAheadResetRunPreview> {
  const res = await api.get<{
    success: boolean;
    data: LookAheadResetRunPreview;
  }>('/settings/look-ahead-reset/run-preview', {
    params: {
      scope: params.scope,
      days: params.days,
      includePast: params.includePast,
    },
  });
  return res.data.data;
}

export async function runLookAheadResetNow(
  body: LookAheadResetManualRunBody
): Promise<LookAheadResetBatchRunResult> {
  const res = await api.post<{
    success: boolean;
    data: LookAheadResetBatchRunResult;
  }>('/settings/look-ahead-reset/run', body);
  return res.data.data;
}

export async function rollbackLookAheadReset(): Promise<LookAheadResetRollbackResult> {
  const res = await api.post<{
    success: boolean;
    data: LookAheadResetRollbackResult;
  }>('/settings/look-ahead-reset/rollback');
  return res.data.data;
}
