import type {
  UpsertActivityFlagRequest,
  UpsertActivityFlagsRequest,
} from '@corpcal/shared/schemas';

import api from './axios';

/**
 * Flag an activity for a team member.
 * PUT /activities/:id/flag
 */
export async function upsertActivityFlag(
  activityId: number,
  body: UpsertActivityFlagRequest
): Promise<void> {
  await api.put(`/activities/${activityId}/flag`, body);
}

export interface SyncActivityFlagsResponse {
  success: boolean;
  addedFlaggedUserIds: number[];
  removedFlaggedUserIds: number[];
}

/**
 * Sync the full flagged-user set for an activity/team pair.
 * PUT /activities/:id/flags
 */
export async function syncActivityFlags(
  activityId: number,
  body: UpsertActivityFlagsRequest
): Promise<SyncActivityFlagsResponse> {
  const response = await api.put<SyncActivityFlagsResponse>(
    `/activities/${activityId}/flags`,
    body
  );
  return response.data;
}

/**
 * Remove (unflag) an activity for the given team.
 * DELETE /activities/:id/flag/:teamId
 */
export async function removeActivityFlag(
  activityId: number,
  teamId: number
): Promise<void> {
  await api.delete(`/activities/${activityId}/flag/${teamId}`);
}

/**
 * Remove one user's flag for an activity/team pair.
 * DELETE /activities/:id/flag/:teamId/:flaggedUserId
 */
export async function removeActivityFlagForUser(
  activityId: number,
  teamId: number,
  flaggedUserId: number
): Promise<void> {
  await api.delete(`/activities/${activityId}/flag/${teamId}/${flaggedUserId}`);
}
