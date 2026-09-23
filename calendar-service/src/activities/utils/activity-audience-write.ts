import type { Activity } from '@corpcal/database/types';
import type { HistoryAudience } from '@corpcal/shared';

/** Operational + conditional public last-updated columns for an activity save. */
export function buildActivityTimestampUpdate(
  audience: HistoryAudience,
  userId: number,
  now: Date
): Pick<Activity, 'lastUpdatedBy' | 'lastUpdatedDateTime'> &
  Partial<Pick<Activity, 'publicLastUpdatedBy' | 'publicLastUpdatedDateTime'>> {
  const operational = {
    lastUpdatedBy: userId,
    lastUpdatedDateTime: now,
  };
  if (audience === 'public') {
    return {
      ...operational,
      publicLastUpdatedBy: userId,
      publicLastUpdatedDateTime: now,
    };
  }
  return operational;
}
