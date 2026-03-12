import type { ActivityResponse } from '@corpcal/shared/api/types';
import type {
  FilterActivitiesQueryParams,
  UpdateActivityRequest,
} from '@corpcal/shared/schemas';
import type { ActivityFilterState } from '@/components/activity/ActivityTable/activityFilterState';
import type { ActivityTableRow } from '@/components/activity/ActivityTable/activityTableRow';
import { CONFIRMED_STATUS_NAMES } from '@/lib/datetime-utils';

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

/** Optional context for filterActivityRowsByFilters (e.g. lookup options to resolve IDs to labels). */
export interface FilterActivityRowsContext {
  /** Options for translation required statuses (value = id, label = displayName matching row.translationsRequiredStatus). */
  translationRequiredStatusOptions?: Array<{ value: string; label: string }>;
  /** Options for translation languages (value = id, label = string that appears in row.translationsRequired). */
  translationLanguageOptions?: Array<{ value: string; label: string }>;
}

/**
 * Client-side filter by date range, category (names), status (IDs), pitch, tags, leads, translations, etc.
 * Same semantics as backend where applicable.
 * Optional context provides lookup options to resolve filter IDs to labels (e.g. for translation languages).
 */
export function filterActivityRowsByFilters(
  rows: ActivityTableRow[],
  filterState: ActivityFilterState,
  context?: FilterActivityRowsContext
): ActivityTableRow[] {
  let result = rows;

  const dr = filterState.dateRange;
  const dateRangeActive =
    dr.startDate !== '' || dr.endDate !== '' || dr.noStartDate || dr.noEndDate;
  if (dateRangeActive) {
    result = result.filter((row) => {
      const start = row.startDate ?? '';
      const end = row.endDate ?? '';
      if (start === '' || end === '') return false;
      return (
        isDateInRange(
          start,
          dr.startDate,
          dr.endDate,
          dr.noStartDate,
          dr.noEndDate
        ) &&
        isDateInRange(
          end,
          dr.startDate,
          dr.endDate,
          dr.noStartDate,
          dr.noEndDate
        )
      );
    });
  }

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

  if (filterState.lookAheadStatusValues.length > 0) {
    const statusSet = new Set(filterState.lookAheadStatusValues);
    result = result.filter((row) => {
      const status = row.lookAheadStatus ?? null;
      return status !== null && statusSet.has(status);
    });
  }

  if (filterState.lookAheadSectionValues.length > 0) {
    const sectionSet = new Set(filterState.lookAheadSectionValues);
    result = result.filter((row) => {
      const section = row.lookAheadSection ?? null;
      return section !== null && sectionSet.has(section);
    });
  }

  const isStatusConfirmed = (s: string) =>
    CONFIRMED_STATUS_NAMES.includes((s ?? '').trim().toLowerCase());
  if (filterState.dateConfirmedFilter !== 'any') {
    if (filterState.dateConfirmedFilter === 'confirmed') {
      result = result.filter((row) => isStatusConfirmed(row.dateStatus));
    } else {
      result = result.filter((row) => !isStatusConfirmed(row.dateStatus));
    }
  }
  if (filterState.timeConfirmedFilter !== 'any') {
    if (filterState.timeConfirmedFilter === 'confirmed') {
      result = result.filter((row) => isStatusConfirmed(row.timeStatus));
    } else {
      result = result.filter((row) => !isStatusConfirmed(row.timeStatus));
    }
  }

  if (filterState.tagIds.length > 0) {
    const tagIdSet = new Set(filterState.tagIds);
    result = result.filter((row) => row.tags.some((t) => tagIdSet.has(t.id)));
  }

  if (filterState.leadMinistryIds.length > 0) {
    const ministrySet = new Set(filterState.leadMinistryIds);
    result = result.filter(
      (row) => row.leadMinistryId != null && ministrySet.has(row.leadMinistryId)
    );
  }
  if (filterState.leadOrgIds.length > 0) {
    const orgSet = new Set(filterState.leadOrgIds);
    result = result.filter(
      (row) => row.leadOrgId != null && orgSet.has(row.leadOrgId)
    );
  }
  if (filterState.commsContactLeadUserIds.length > 0) {
    const commsSet = new Set(filterState.commsContactLeadUserIds);
    result = result.filter(
      (row) =>
        row.commsContactLeadUserId != null &&
        commsSet.has(row.commsContactLeadUserId)
    );
  }
  if (filterState.eventPlannerLeadIds.length > 0) {
    const plannerSet = new Set(filterState.eventPlannerLeadIds);
    result = result.filter(
      (row) =>
        row.eventPlannerLeadId != null && plannerSet.has(row.eventPlannerLeadId)
    );
  }

  if (
    filterState.translationRequiredStatusIds.length > 0 &&
    context?.translationRequiredStatusOptions
  ) {
    const idSet = new Set(filterState.translationRequiredStatusIds);
    const statusLabelSet = new Set(
      context.translationRequiredStatusOptions
        .filter((opt) => idSet.has(parseInt(opt.value, 10)))
        .map((opt) => opt.label)
    );
    result = result.filter(
      (row) =>
        row.translationsRequiredStatus != null &&
        statusLabelSet.has(row.translationsRequiredStatus)
    );
  }

  if (
    filterState.translationLanguageIds.length > 0 &&
    context?.translationLanguageOptions
  ) {
    const idSet = new Set(filterState.translationLanguageIds);
    const labelSet = new Set(
      context.translationLanguageOptions
        .filter((opt) => idSet.has(parseInt(opt.value, 10)))
        .map((opt) => opt.label)
    );
    result = result.filter((row) =>
      row.translationsRequired.some((t) => labelSet.has(t))
    );
  }

  return result;
}

/** Params for activity list query (archive + context only; date/status filtered client-side). */
export type ActivityListQueryParams = Partial<
  Pick<
    FilterActivitiesQueryParams,
    | 'includeCompleted'
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
    includeCompleted,
    includeDeleted,
    leadTeamId,
    commsContactLeadUserId,
    sharedWithTeamId,
    sharedWithTeamIds,
  } = params;
  const out: ActivityListQueryParams = {};
  if (includeCompleted !== undefined) out.includeCompleted = includeCompleted;
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
