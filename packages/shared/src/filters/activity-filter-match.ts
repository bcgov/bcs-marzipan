import type { ActivityFilterState } from '../activity-filter-state';
import {
  activityScheduledRangeOverlaps,
  isDateInRange,
  isDateRangeActive,
} from './activity-filter-date';
import type { ActivityFilterMatchInput } from './activity-filter-match-input';
import { isConfirmedStatusLabel } from './confirmed-status-names';

/**
 * Optional resolution context for {@link activityMatchesFilterState}.
 */
export interface ActivityFilterMatchOptions {
  /**
   * Maps a translation-language filter ID to the label as it appears in
   * {@link ActivityFilterMatchInput.translationLanguageNames}. Used only when
   * the input has no direct `translationLanguageIds`. When neither is
   * available, the language dimension is not applied (the activity is not
   * excluded on that dimension), matching the prior client behavior.
   */
  translationLanguageLabelById?: Map<number, string>;
}

/**
 * Behavioral specification for the shared activity filter.
 *
 * Semantics: dimensions are combined with AND; values within a single
 * multi-select dimension are combined with OR. A dimension with no value in
 * `filterState` is skipped. This mirrors the server SQL implementation in
 * `calendar-service/.../activity-find-all-filters.ts` (the SQL builder is the
 * Reports/list API owner; this function is the canonical predicate spec).
 *
 * Field-scope visibility (e.g. whether a user can view pitch) is intentionally
 * NOT consulted here: predicates apply whenever criteria exist in state.
 */
export function activityMatchesFilterState(
  filterState: ActivityFilterState,
  input: ActivityFilterMatchInput,
  options?: ActivityFilterMatchOptions
): boolean {
  // Scheduled date range: activity span must overlap the filter window.
  if (isDateRangeActive(filterState.dateRange)) {
    if (
      !activityScheduledRangeOverlaps(
        input.startDate,
        input.endDate,
        filterState.dateRange
      )
    ) {
      return false;
    }
  }

  // Category (OR within).
  if (filterState.categoryIds.length > 0) {
    const set = new Set(filterState.categoryIds);
    if (!input.categoryIds.some((id) => set.has(id))) {
      return false;
    }
  }

  // Activity status (OR within).
  if (filterState.activityStatusIds.length > 0) {
    if (!filterState.activityStatusIds.includes(input.activityStatusId)) {
      return false;
    }
  }

  // Pitch required status (case-insensitive, trimmed; OR within).
  if (filterState.pitchRequiredStatusNames.length > 0) {
    const pitchSet = new Set(
      filterState.pitchRequiredStatusNames.map((n) => n.trim().toLowerCase())
    );
    const status = input.pitchRequiredStatusName?.trim().toLowerCase() ?? '';
    if (status === '' || !pitchSet.has(status)) return false;
  }

  // Pitch date.
  const pdf = filterState.pitchDateFilter;
  if (pdf.kind === 'not_scheduled') {
    if (input.pitchDate != null) return false;
  } else if (pdf.kind === 'scheduled') {
    if (input.pitchDate == null) return false;
    const pr = pdf.dateRange;
    if (
      isDateRangeActive(pr) &&
      !isDateInRange(
        input.pitchDate,
        pr.startDate,
        pr.endDate,
        pr.noStartDate,
        pr.noEndDate
      )
    ) {
      return false;
    }
  }

  // Look ahead status / section (OR within each; AND across the two).
  if (filterState.lookAheadStatusValues.length > 0) {
    if (
      input.lookAheadStatus == null ||
      !filterState.lookAheadStatusValues.includes(input.lookAheadStatus)
    ) {
      return false;
    }
  }
  if (filterState.lookAheadSectionValues.length > 0) {
    if (
      input.lookAheadSection == null ||
      !filterState.lookAheadSectionValues.includes(input.lookAheadSection)
    ) {
      return false;
    }
  }

  // Date / time confirmation status.
  if (
    filterState.dateConfirmedFilter === 'confirmed' &&
    !isConfirmedStatusLabel(input.dateStatusName)
  ) {
    return false;
  }
  if (
    filterState.dateConfirmedFilter === 'not_confirmed' &&
    isConfirmedStatusLabel(input.dateStatusName)
  ) {
    return false;
  }
  if (
    filterState.timeConfirmedFilter === 'confirmed' &&
    !isConfirmedStatusLabel(input.timeStatusName)
  ) {
    return false;
  }
  if (
    filterState.timeConfirmedFilter === 'not_confirmed' &&
    isConfirmedStatusLabel(input.timeStatusName)
  ) {
    return false;
  }

  // Tags (OR within).
  if (filterState.tagIds.length > 0) {
    const tagSet = new Set(filterState.tagIds);
    if (!input.tagIds.some((id) => tagSet.has(id))) return false;
  }

  // Lead team (OR within).
  if (filterState.leadTeamIds.length > 0) {
    if (
      input.leadTeamId == null ||
      !filterState.leadTeamIds.includes(input.leadTeamId)
    ) {
      return false;
    }
  }

  // Leads (AND across types; OR within each type).
  if (filterState.commsContactLeadUserIds.length > 0) {
    if (
      input.commsContactLeadUserId == null ||
      !filterState.commsContactLeadUserIds.includes(
        input.commsContactLeadUserId
      )
    ) {
      return false;
    }
  }
  if (filterState.eventPlannerLeadIds.length > 0) {
    const plannerSet = new Set(filterState.eventPlannerLeadIds);
    if (!input.eventPlannerLeadIds.some((id) => plannerSet.has(id))) {
      return false;
    }
  }

  // Translation required status (ID-based; OR within).
  if (filterState.translationRequiredStatusIds.length > 0) {
    if (
      input.translationsRequiredStatusId == null ||
      !filterState.translationRequiredStatusIds.includes(
        input.translationsRequiredStatusId
      )
    ) {
      return false;
    }
  }

  // Translation languages: ID-based when available, else label-resolved.
  if (filterState.translationLanguageIds.length > 0) {
    if (input.translationLanguageIds != null) {
      const langSet = new Set(input.translationLanguageIds);
      if (!filterState.translationLanguageIds.some((id) => langSet.has(id))) {
        return false;
      }
    } else if (options?.translationLanguageLabelById) {
      const resolver = options.translationLanguageLabelById;
      const labelSet = new Set(
        filterState.translationLanguageIds
          .map((id) => resolver.get(id))
          .filter((label): label is string => label != null)
      );
      if (!input.translationLanguageNames.some((n) => labelSet.has(n))) {
        return false;
      }
    }
    // No IDs and no resolver: cannot evaluate; do not exclude on this dimension.
  }

  return true;
}
