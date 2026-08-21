import {
  activityMatchesFilterState,
  activityMatchesSearchKeyword,
  type ActivityFilterMatchInput,
  type ActivityFilterState,
  type ActivitySearchableInput,
} from '@corpcal/shared';
import type { ActivityListItem } from '@corpcal/shared/api/types';
import type {
  FilterActivitiesQueryParams,
  UpdateActivityRequest,
} from '@corpcal/shared/schemas';
import { plainTextFromActivityRichField } from '@corpcal/shared/utils';
import type { ActivityTableRow } from '@/components/activity/ActivityTable/activityTableRow';
import type { OptionItem } from '@/schemas/types';

/** Maps a table row to the shared searchable-text input. */
function activityTableRowToSearchableInput(
  row: ActivityTableRow
): ActivitySearchableInput {
  return {
    title: row.title,
    displayId: row.displayId,
    summaryPlainText: plainTextFromActivityRichField(row.summary),
    executiveSummaryPlainText: plainTextFromActivityRichField(
      row.executiveSummary
    ),
    categoryNames: row.activityCategories,
    tagTexts: row.tags.map((t) => t.text),
    lookAheadStatus: row.lookAheadStatus,
    lookAheadSection: row.lookAheadSection,
    venueText: row.venue ?? '',
    leadOrg: row.leadOrg,
    leadMinistryAbbreviation: row.leadMinistryAbbreviation,
    leadMinistry: row.leadMinistry,
    commsLeadName: row.commsLeadName,
    eventPlanners: row.eventPlanners ?? [],
    activityStatus: row.activityStatus,
    representatives: row.activityRepresentatives,
  };
}

/**
 * Client-side keyword filter for activity table rows.
 * Delegates to the shared keyword matcher so the searchable field set stays in
 * sync with the Reports server search. Returns all rows when keyword is empty.
 */
export function filterActivityRowsByKeyword(
  rows: ActivityTableRow[],
  keyword: string
): ActivityTableRow[] {
  if (keyword.trim() === '') return rows;
  return rows.filter((row) =>
    activityMatchesSearchKeyword(
      activityTableRowToSearchableInput(row),
      keyword
    )
  );
}

/** Optional context for filterActivityRowsByFilters (lookup options to resolve IDs to labels). */
export interface FilterActivityRowsContext {
  /** Options for translation languages (value = id, label = string that appears in row.translationsRequired). */
  translationLanguageOptions?: OptionItem[];
}

/** Maps a table row to the shared filter-match input. */
function activityTableRowToFilterMatchInput(
  row: ActivityTableRow
): ActivityFilterMatchInput {
  return {
    id: row.id,
    startDate: row.startDate,
    endDate: row.endDate,
    categoryIds: row.categoryIds,
    activityStatusId: row.activityStatusId,
    pitchRequiredStatusName: row.pitchRequiredStatus,
    pitchDate: row.pitchDate,
    lookAheadStatus: row.lookAheadStatus,
    lookAheadSection: row.lookAheadSection,
    dateStatusName: row.dateStatus,
    timeStatusName: row.timeStatus,
    tagIds: row.tags.map((t) => t.id),
    leadTeamId: row.leadTeamId,
    leadMinistryId: row.leadMinistryId,
    leadOrgId: row.leadOrgId,
    commsContactLeadUserId: row.commsContactLeadUserId,
    eventPlannerLeadIds: row.eventPlannerLeadIds ?? [],
    translationsRequiredStatusId: row.translationsRequiredStatusId,
    translationLanguageNames: row.translationsRequired,
  };
}

/** Builds a translation-language id -> label resolver from lookup options. */
function buildTranslationLanguageLabelById(
  options: OptionItem[] | undefined
): Map<number, string> | undefined {
  if (!options) return undefined;
  const map = new Map<number, string>();
  for (const opt of options) {
    const id = parseInt(opt.value, 10);
    if (Number.isFinite(id)) map.set(id, opt.label);
  }
  return map;
}

/**
 * True when every selected translation-language filter ID can be resolved from
 * lookup options. Used to defer client-side filtering until lookups load.
 */
export function canResolveTranslationLanguageFilter(
  filterState: ActivityFilterState,
  context?: FilterActivityRowsContext
): boolean {
  if (filterState.translationLanguageIds.length === 0) return true;
  const labelById = buildTranslationLanguageLabelById(
    context?.translationLanguageOptions
  );
  if (!labelById) return false;
  return filterState.translationLanguageIds.every((id) => labelById.has(id));
}

/**
 * Client-side filter by date range, category (IDs), status (IDs), pitch, tags, leads, translations, etc.
 * Delegates to the shared {@link activityMatchesFilterState} predicate so list and
 * Reports apply identical rules. Optional context resolves translation-language
 * IDs to labels (the only dimension that cannot be matched by ID on the client).
 */
export function filterActivityRowsByFilters(
  rows: ActivityTableRow[],
  filterState: ActivityFilterState,
  context?: FilterActivityRowsContext
): ActivityTableRow[] {
  const translationLanguageLabelById = buildTranslationLanguageLabelById(
    context?.translationLanguageOptions
  );
  return rows.filter((row) =>
    activityMatchesFilterState(
      filterState,
      activityTableRowToFilterMatchInput(row),
      { translationLanguageLabelById }
    )
  );
}

/** Params for activity list query (archive + tab context only; panel filters are client-side). */
export type ActivityListQueryParams = Partial<
  Pick<
    FilterActivitiesQueryParams,
    | 'includeCompleted'
    | 'includeDeleted'
    | 'leadTeamIds'
    | 'commsContactLeadUserIds'
    | 'sharedWithTeamIds'
    | 'flaggedUserIds'
  >
>;

function sortNumericArray(ids: number[]): number[] {
  return [...ids].sort((a, b) => a - b);
}

/** Normalize filters so the same logical view produces a stable query key. */
export function normalizeListParams(
  params: ActivityListQueryParams = {}
): ActivityListQueryParams {
  const {
    includeCompleted,
    includeDeleted,
    leadTeamIds,
    commsContactLeadUserIds,
    sharedWithTeamIds,
    flaggedUserIds,
  } = params;
  const out: ActivityListQueryParams = {};
  if (includeCompleted !== undefined) out.includeCompleted = includeCompleted;
  if (includeDeleted !== undefined) out.includeDeleted = includeDeleted;
  if (leadTeamIds !== undefined && leadTeamIds.length > 0) {
    out.leadTeamIds = sortNumericArray(leadTeamIds);
  }
  if (
    commsContactLeadUserIds !== undefined &&
    commsContactLeadUserIds.length > 0
  ) {
    out.commsContactLeadUserIds = sortNumericArray(commsContactLeadUserIds);
  }
  if (sharedWithTeamIds !== undefined && sharedWithTeamIds.length > 0) {
    out.sharedWithTeamIds = sortNumericArray(sharedWithTeamIds);
  }
  if (flaggedUserIds !== undefined && flaggedUserIds.length > 0) {
    out.flaggedUserIds = sortNumericArray(flaggedUserIds);
  }
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
] as const satisfies readonly (keyof ActivityListItem &
  keyof UpdateActivityRequest)[];

/** Merge an update payload into an existing activity for optimistic UI; only mergeable keys are applied. */
export function buildOptimisticActivity(
  existing: ActivityListItem,
  update: UpdateActivityRequest
): ActivityListItem {
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
