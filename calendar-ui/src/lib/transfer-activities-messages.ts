/** Success toast title after POST /users/:id/transfer-activities. */
export function formatTransferActivitiesSuccessTitle(): string {
  return 'Activities transferred';
}

/** Success toast description after POST /users/:id/transfer-activities. */
export function formatTransferActivitiesSuccessDescription(
  activitiesAffected: number,
  sourceUserName: string,
  targetUserName: string
): string {
  const countLabel = `${activitiesAffected} activit${activitiesAffected === 1 ? 'y' : 'ies'}`;
  return `${countLabel} moved from ${sourceUserName} to ${targetUserName}`;
}
