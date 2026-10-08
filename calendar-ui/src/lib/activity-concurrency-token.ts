import type { ActivityResponse } from '@corpcal/shared/schemas';

type ActivityConcurrencyFields = Pick<
  ActivityResponse,
  'lastUpdatedDateTime' | 'publicLastUpdatedDateTime'
>;

export function getActivityConcurrencyToken(
  activity: ActivityConcurrencyFields
): string | null {
  return (
    activity.lastUpdatedDateTime ?? activity.publicLastUpdatedDateTime ?? null
  );
}
