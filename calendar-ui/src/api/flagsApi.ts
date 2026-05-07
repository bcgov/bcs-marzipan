import type { UpsertActivityFlagRequest } from '@corpcal/shared/schemas';

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
