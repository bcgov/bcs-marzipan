import type { UpsertActivityFlagsRequest } from '@corpcal/shared/schemas';

import api from './axios';

export interface SyncActivityFlagsResult {
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
): Promise<SyncActivityFlagsResult> {
  const response = await api.put<{
    success: boolean;
    data: SyncActivityFlagsResult;
  }>(`/activities/${activityId}/flags`, body);
  return response.data.data;
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
