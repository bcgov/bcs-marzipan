import {
  activityMatchesSearchKeyword,
  activityResponseToSearchableInput,
} from '@corpcal/shared';
import type { ActivityResponse } from '@corpcal/shared/api/types';

/**
 * Report-only keyword filter on API activities.
 * Delegates to the shared keyword matcher so the searchable field set stays in
 * sync with the Activity List client search (see packages/shared filters).
 */
export function filterActivityResponsesBySearchKeyword(
  activities: ActivityResponse[],
  keyword: string | undefined
): ActivityResponse[] {
  if ((keyword ?? '').trim() === '') return activities;
  return activities.filter((activity) =>
    activityMatchesSearchKeyword(
      activityResponseToSearchableInput(activity),
      keyword
    )
  );
}
