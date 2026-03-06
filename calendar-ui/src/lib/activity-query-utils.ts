import type { ActivityResponse } from '@corpcal/shared/api/types';
import type {
  FilterActivitiesQueryParams,
  UpdateActivityRequest,
} from '@corpcal/shared/schemas';
import type { ActivityTableRow } from '@/components/ActivityTable/activityTableRow';

/**
 * Client-side keyword filter for activity table rows.
 * Matches when the trimmed keyword appears (case-insensitive) in any searchable field.
 * Returns all rows when keyword is empty.
 */
export function filterActivityRowsByKeyword(
  rows: ActivityTableRow[],
  keyword: string
): ActivityTableRow[] {
  const term = keyword.trim();
  if (term === '') return rows;
  const lower = term.toLowerCase();
  return rows.filter((row) => {
    const searchableValues: string[] = [
      row.title,
      row.displayId ?? '',
      row.summary,
      row.activityCategories.join(' '),
      row.tags.map((t) => t.text).join(' '),
      row.lookAheadStatus ?? '',
      row.lookAheadSection ?? '',
      row.venue ?? '',
      row.leadOrg ?? '',
      row.leadMinistryAbbreviation ?? '',
      row.leadMinistry ?? '',
      row.commsLeadName ?? '',
      row.eventLead ?? '',
      row.activityStatus,
      row.activityRepresentatives.join(' '),
    ];
    return searchableValues.some((v) => v.toLowerCase().includes(lower));
  });
}

/** Params for activity list query; extend with sort, search, etc. later. */
export type ActivityListQueryParams = Partial<
  Pick<
    FilterActivitiesQueryParams,
    | 'excludeCompleted'
    | 'includeDeleted'
    | 'leadTeamId'
    | 'commsContactLeadUserId'
    | 'sharedWithTeamId'
    | 'sharedWithTeamIds'
  >
>;

/** Normalize filters so the same logical view produces a stable query key. */
export function normalizeListParams(
  params: ActivityListQueryParams = {}
): ActivityListQueryParams {
  const {
    excludeCompleted,
    includeDeleted,
    leadTeamId,
    commsContactLeadUserId,
    sharedWithTeamId,
    sharedWithTeamIds,
  } = params;
  const out: ActivityListQueryParams = {};
  if (excludeCompleted !== undefined) out.excludeCompleted = excludeCompleted;
  if (includeDeleted !== undefined) out.includeDeleted = includeDeleted;
  if (leadTeamId !== undefined) out.leadTeamId = leadTeamId;
  if (commsContactLeadUserId !== undefined)
    out.commsContactLeadUserId = commsContactLeadUserId;
  if (sharedWithTeamId !== undefined) out.sharedWithTeamId = sharedWithTeamId;
  if (sharedWithTeamIds !== undefined && sharedWithTeamIds.length > 0)
    out.sharedWithTeamIds = [...sharedWithTeamIds].sort((a, b) => a - b);
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
