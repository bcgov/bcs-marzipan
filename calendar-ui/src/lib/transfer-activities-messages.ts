/** Success toast after POST /users/:id/transfer-activities (transferredCount = activities affected). */
export function formatTransferActivitiesSuccessMessage(
  activitiesAffected: number
): string {
  return `${activitiesAffected} activit${activitiesAffected === 1 ? 'y' : 'ies'} updated`;
}
