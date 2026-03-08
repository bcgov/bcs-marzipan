import type { ActivityResponse } from '@corpcal/shared/api/types';
import type {
  FilterActivitiesQueryParams,
  UpdateActivityRequest,
} from '@corpcal/shared/schemas';
import type { ActivityFilterState } from '@/components/ActivityTable/activityFilterState';
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

/**
 * Returns true when a single ISO date string falls within the given range.
 * noStartDate = no lower bound; noEndDate = no upper bound.
 */
function isDateInRange(
  isoDate: string,
  startDate: string,
  endDate: string,
  noStartDate: boolean,
  noEndDate: boolean
): boolean {
  const d = isoDate.slice(0, 10);
  if (!noStartDate && startDate !== '' && d < startDate) return false;
  if (!noEndDate && endDate !== '' && d > endDate) return false;
  return true;
}

/**
 * Client-side filter by category (names), status (IDs), and pitch (status names + date).
 * Date filtering is done server-side via query params.
 */
export function filterActivityRowsByFilters(
  rows: ActivityTableRow[],
  filterState: ActivityFilterState
): ActivityTableRow[] {
  let result = rows;

  if (filterState.categoryNames.length > 0) {
    const set = new Set(
      filterState.categoryNames.map((n) => n.toLowerCase().trim())
    );
    result = result.filter((row) =>
      row.activityCategories.some((c) => set.has(c.toLowerCase().trim()))
    );
  }

  if (filterState.activityStatusIds.length > 0) {
    const statusSet = new Set(filterState.activityStatusIds);
    result = result.filter((row) => statusSet.has(row.activityStatusId));
  }

  if (filterState.pitchRequiredStatusNames.length > 0) {
    const pitchSet = new Set(
      filterState.pitchRequiredStatusNames.map((n) => n.trim().toLowerCase())
    );
    result = result.filter((row) => {
      const status = row.pitchRequiredStatus?.trim().toLowerCase() ?? '';
      return status !== '' && pitchSet.has(status);
    });
  }

  const pdf = filterState.pitchDateFilter;
  if (pdf.kind === 'not_scheduled') {
    result = result.filter((row) => row.pitchDate == null);
  } else if (pdf.kind === 'scheduled') {
    result = result.filter((row) => {
      if (row.pitchDate == null) return false;
      const dr = pdf.dateRange;
      const rangeActive =
        dr.startDate !== '' ||
        dr.endDate !== '' ||
        dr.noStartDate ||
        dr.noEndDate;
      if (!rangeActive) return true;
      return isDateInRange(
        row.pitchDate,
        dr.startDate,
        dr.endDate,
        dr.noStartDate,
        dr.noEndDate
      );
    });
  }

  return result;
}

/** Params for activity list query. */
export type ActivityListQueryParams = Partial<
  Pick<
    FilterActivitiesQueryParams,
    | 'excludeCompleted'
    | 'includeDeleted'
    | 'leadTeamId'
    | 'commsContactLeadUserId'
    | 'sharedWithTeamId'
    | 'sharedWithTeamIds'
    | 'startDateFrom'
    | 'startDateTo'
    | 'endDateFrom'
    | 'endDateTo'
    | 'activityStatusId'
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
    startDateFrom,
    startDateTo,
    endDateFrom,
    endDateTo,
    activityStatusId,
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
  if (startDateFrom !== undefined && startDateFrom !== '')
    out.startDateFrom = startDateFrom;
  if (startDateTo !== undefined && startDateTo !== '')
    out.startDateTo = startDateTo;
  if (endDateFrom !== undefined && endDateFrom !== '')
    out.endDateFrom = endDateFrom;
  if (endDateTo !== undefined && endDateTo !== '') out.endDateTo = endDateTo;
  if (activityStatusId !== undefined) out.activityStatusId = activityStatusId;
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
