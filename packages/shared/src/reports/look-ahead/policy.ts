/**
 * Policy: which `reports.name` values define the canonical look-ahead section list.
 *
 * Centralised here so service, validation, and UI stay in sync
 */
export const LOOK_AHEAD_REPORT_NAME = 'look-ahead' as const;
export const EXEC_LOOK_AHEAD_REPORT_NAME = 'exec' as const;

/**
 * Source-of-truth report names whose `config.sections[].filter.lookAheadSection`
 * keys make up the allowed `activity.lookAheadSection` values across the app.
 *
 * Order matters: when collecting allowed keys we keep the first occurrence so the
 * primary look-ahead report defines canonical ordering and labels.
 */
export const LOOK_AHEAD_SOURCE_REPORT_NAMES = [
  LOOK_AHEAD_REPORT_NAME,
  EXEC_LOOK_AHEAD_REPORT_NAME,
] as const;

export type LookAheadSourceReportName =
  (typeof LOOK_AHEAD_SOURCE_REPORT_NAMES)[number];
