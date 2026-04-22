import type { ReviewExemptFieldKeysSettings } from '@corpcal/shared/schemas';

import api from './axios';

export async function fetchReviewExemptFieldSettings(): Promise<ReviewExemptFieldKeysSettings> {
  const res = await api.get<{
    success: boolean;
    data: ReviewExemptFieldKeysSettings;
  }>('/settings/review-exempt-fields');
  return res.data.data;
}

export async function patchReviewExemptFieldSettings(
  body: ReviewExemptFieldKeysSettings
): Promise<ReviewExemptFieldKeysSettings> {
  const res = await api.patch<{
    success: boolean;
    data: ReviewExemptFieldKeysSettings;
  }>('/settings/review-exempt-fields', body);
  return res.data.data;
}
