import type { ActivityResponse } from '@corpcal/shared/api/types';
import type {
  FilterActivitiesQueryParams,
  UpdateActivityRequest,
} from '@corpcal/shared/schemas';

/** Params for activity list query; extend with sort, search, etc. later. */
export type ActivityListQueryParams = Partial<
  Pick<FilterActivitiesQueryParams, 'excludeCompleted' | 'includeDeleted'>
>;

/** Normalize filters so the same logical view produces a stable query key. */
export function normalizeListParams(
  params: ActivityListQueryParams = {}
): ActivityListQueryParams {
  const { excludeCompleted, includeDeleted } = params;
  const out: ActivityListQueryParams = {};
  if (excludeCompleted !== undefined) out.excludeCompleted = excludeCompleted;
  if (includeDeleted !== undefined) out.includeDeleted = includeDeleted;
  return out;
}

/** Fields safe to optimistically merge from UpdateActivityRequest into ActivityResponse (table-displayed, same shape on both types). */
const OPTIMISTIC_MERGEABLE_KEYS = [
  'title',
  'summary',
  'isConfidential',
  'isIssue',
  'isAllDay',
  'startDate',
  'endDate',
  'startTime',
  'endTime',
  'lookAheadStatus',
  'lookAheadSection',
  'pitchDate',
] as const satisfies readonly (keyof ActivityResponse &
  keyof UpdateActivityRequest)[];

/** Merge an update payload into an existing activity for optimistic UI; only mergeable keys are applied. */
export function buildOptimisticActivity(
  existing: ActivityResponse,
  update: UpdateActivityRequest
): ActivityResponse {
  const merged = { ...existing };
  for (const key of OPTIMISTIC_MERGEABLE_KEYS) {
    if (key in update) {
      (merged as Record<string, unknown>)[key] = (
        update as Record<string, unknown>
      )[key];
    }
  }
  return merged;
}
