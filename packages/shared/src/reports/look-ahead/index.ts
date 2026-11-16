/**
 * Look Ahead feature module (shared).
 *
 * Public API for callers in calendar-service, calendar-ui, and shared print/PDF
 * code. Implementation files (resolver, policy constants) live alongside this
 * barrel; `report-config.schema` stays generic and never imports from here.
 */
export {
  LOOK_AHEAD_REPORT_NAME,
  EXEC_LOOK_AHEAD_REPORT_NAME,
  LOOK_AHEAD_SOURCE_REPORT_NAMES,
  type LookAheadSourceReportName,
} from './policy';
export {
  allowedLookAheadSectionKeysFromReports,
  isAllowedLookAheadSectionKey,
  resolveLookAheadSectionRows,
  type LookAheadSectionRow,
  type ResolveLookAheadSectionRowsOptions,
} from './resolveLookAheadSectionRows';
export {
  DEFAULT_LOOK_AHEAD_QUICK_PICK,
  defaultLookAheadDateRange,
  LOOK_AHEAD_QUICK_PICKS,
  lookAheadDateRangeFromTomorrow,
  lookAheadQuickPickFromRange,
  lookAheadQuickPickRange,
  lookAheadTodayRange,
  type LookAheadDateRange,
  type LookAheadForwardDayCount,
  type LookAheadQuickPick,
} from './lookAheadDateRange';
export {
  DEFAULT_LOOK_AHEAD_CURATED_PRESET,
  defaultLookAheadCuratedDateRange,
  LOOK_AHEAD_CURATED_PRESET_IDS,
  LOOK_AHEAD_CURATED_PRESET_META,
  lookAheadCuratedPresetFromRange,
  lookAheadCuratedPresetRange,
  type LookAheadCuratedDateRange,
  type LookAheadCuratedPresetId,
  type LookAheadCuratedPresetMeta,
} from './lookAheadCuratedDateRange';
export {
  pacificCalendarDateFromInstant,
  type CalendarDateString,
} from '../../datetime';
