import type { ActivityTeamSharingResponse } from '@corpcal/shared/api/types';
import { activityTeamSharingResponseSchema } from '@corpcal/shared/schemas';

import api from './axios';

export async function fetchActivityTeamSharing(): Promise<ActivityTeamSharingResponse> {
  const res = await api.get<{
    success: boolean;
    data: ActivityTeamSharingResponse;
  }>('/lookups/activity-team-sharing');
  const parsed = activityTeamSharingResponseSchema.safeParse(res.data.data);
  if (!parsed.success) {
    throw new Error('Invalid activity team sharing response');
  }
  return parsed.data;
}
