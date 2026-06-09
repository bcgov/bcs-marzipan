import type { ActivityFilterState } from '../activity-filter-state';
import type { ReportDataQueryParams } from '../schemas/query-params.schema';
import { isDateRangeActive } from './activity-filter-date';

export interface ActivityStatusArchiveIds {
  completedStatusId?: number;
  deletedStatusId?: number;
}

export interface ActivityFilterPreferencesInput {
  filterState: ActivityFilterState;
  showCompleted: boolean;
  showDeleted: boolean;
}

function nonEmptyArray<T>(arr: T[]): T[] | undefined {
  return arr.length > 0 ? arr : undefined;
}

function nonEmptyTrimmedStrings(arr: string[]): string[] | undefined {
  const trimmed = arr.map((s) => s.trim()).filter((s) => s.length > 0);
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Maps activity filter panel state to report / activities API query params.
 * All ID-list filters use array params with OR semantics on the server.
 *
 * Keyword search is intentionally excluded: the Activity List applies it
 * client-side over the cached list; Reports preview does the same over the
 * cached payload (stable fetch query key). Pass `search` separately when
 * exporting so PDF/CSV/XLSX match the on-screen filter.
 */
export function activityFilterStateToQueryParams(
  input: ActivityFilterPreferencesInput,
  statusArchive: ActivityStatusArchiveIds,
  canSeeDeleted: boolean
): Partial<ReportDataQueryParams> {
  const { filterState: fs, showCompleted, showDeleted } = input;

  const hasStatusFilter = fs.activityStatusIds.length > 0;
  const statusIncludesCompleted =
    statusArchive.completedStatusId != null &&
    fs.activityStatusIds.includes(statusArchive.completedStatusId);
  const statusIncludesDeleted =
    statusArchive.deletedStatusId != null &&
    fs.activityStatusIds.includes(statusArchive.deletedStatusId);

  const effectiveShowCompleted = hasStatusFilter
    ? statusIncludesCompleted
    : showCompleted;
  const effectiveShowDeleted = hasStatusFilter
    ? statusIncludesDeleted && canSeeDeleted
    : showDeleted && canSeeDeleted;

  const params: Partial<ReportDataQueryParams> = {
    includeCompleted: effectiveShowCompleted,
    includeDeleted: canSeeDeleted ? effectiveShowDeleted : false,
  };

  if (isDateRangeActive(fs.dateRange)) {
    if (!fs.dateRange.noStartDate && fs.dateRange.startDate !== '') {
      params.startDateFrom = fs.dateRange.startDate;
    }
    if (!fs.dateRange.noEndDate && fs.dateRange.endDate !== '') {
      params.startDateTo = fs.dateRange.endDate;
    }
    params.scheduledBothDatesInRange = true;
  }

  const statusIds = nonEmptyArray(fs.activityStatusIds);
  if (statusIds) params.activityStatusIds = statusIds;

  const ministryIds = nonEmptyArray(fs.leadMinistryIds);
  if (ministryIds) params.leadMinistryIds = ministryIds;

  const orgIds = nonEmptyArray(fs.leadOrgIds);
  if (orgIds) params.leadOrgIds = orgIds;

  const commsIds = nonEmptyArray(fs.commsContactLeadUserIds);
  if (commsIds) params.commsContactLeadUserIds = commsIds;

  const plannerIds = nonEmptyArray(fs.eventPlannerLeadIds);
  if (plannerIds) params.eventPlannerLeadIds = plannerIds;

  const tagIds = nonEmptyArray(fs.tagIds);
  if (tagIds) params.tagIds = tagIds;

  const categoryNames = nonEmptyTrimmedStrings(fs.categoryNames);
  if (categoryNames) params.categoryNames = categoryNames;

  const translationStatusIds = nonEmptyArray(fs.translationRequiredStatusIds);
  if (translationStatusIds) {
    params.translationRequiredStatusIds = translationStatusIds;
  }

  const translationLanguageIds = nonEmptyArray(fs.translationLanguageIds);
  if (translationLanguageIds) {
    params.translationLanguageIds = translationLanguageIds;
  }

  const pitchNames = nonEmptyTrimmedStrings(fs.pitchRequiredStatusNames);
  if (pitchNames) params.pitchRequiredStatusNames = pitchNames;

  const lookAheadStatuses = nonEmptyArray(fs.lookAheadStatusValues);
  if (lookAheadStatuses) params.lookAheadStatusValues = lookAheadStatuses;

  const lookAheadSections = nonEmptyArray(fs.lookAheadSectionValues);
  if (lookAheadSections) params.lookAheadSectionValues = lookAheadSections;

  if (fs.dateConfirmedFilter !== 'any') {
    params.dateConfirmedFilter = fs.dateConfirmedFilter;
  }
  if (fs.timeConfirmedFilter !== 'any') {
    params.timeConfirmedFilter = fs.timeConfirmedFilter;
  }

  const pdf = fs.pitchDateFilter;
  if (pdf.kind === 'not_scheduled') {
    params.pitchDateNotScheduled = true;
  } else if (pdf.kind === 'scheduled') {
    const dr = pdf.dateRange;
    if (isDateRangeActive(dr)) {
      if (!dr.noStartDate && dr.startDate !== '') {
        params.pitchDateFrom = dr.startDate;
      }
      if (!dr.noEndDate && dr.endDate !== '') {
        params.pitchDateTo = dr.endDate;
      }
    } else {
      params.pitchDateScheduled = true;
    }
  }

  return params;
}
