/**
 * Look-ahead feature module (shared).
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
