import type {
  UpsertActivityFlagRequest,
  UpsertActivityFlagsRequest,
} from '@corpcal/shared/schemas';

import api from './axios';

/**
 * Assign (flag) an activity for a team member.
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
  addedAssigneeIds: number[];
  removedAssigneeIds: number[];
}

/**
 * Sync the full assignee set for an activity/team pair.
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
 * Remove a single assignee flag for an activity/team pair.
 * DELETE /activities/:id/flag/:teamId/:assigneeId
 */
export async function removeAssigneeActivityFlag(
  activityId: number,
  teamId: number,
  assigneeId: number
): Promise<void> {
  await api.delete(`/activities/${activityId}/flag/${teamId}/${assigneeId}`);
}
