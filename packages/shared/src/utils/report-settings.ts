/**
 * Normalized report setting shape expected by the API.
 */
export interface NormalizedReportSetting {
  reportId: number;
  omitted: boolean;
}

/**
 * Form/response may contain request shape { reportId, omitted } or
 * response shape { id, report?, omitted }.
 */
export type ReportSettingInput =
  | { reportId: number; omitted: boolean }
  | { id?: number; report?: { id: number }; omitted?: boolean };

/**
 * Normalizes report settings so each entry has a numeric reportId and omitted flag.
 * Form may contain request shape { reportId, omitted } or response shape
 * { id, report?, omitted }. Invalid entries (no numeric reportId) are skipped.
 */
export function normalizeReportSettings(
  items: ReportSettingInput[] | undefined
): NormalizedReportSetting[] | undefined {
  if (!items || !Array.isArray(items)) return undefined;
  const normalized: NormalizedReportSetting[] = [];
  for (const it of items) {
    const reportId =
      (it &&
        'reportId' in it &&
        typeof it.reportId === 'number' &&
        it.reportId) ||
      (it && 'id' in it && typeof it.id === 'number' && it.id) ||
      (it &&
        'report' in it &&
        it.report &&
        typeof it.report.id === 'number' &&
        it.report.id);
    const omitted =
      it && typeof (it as { omitted?: boolean }).omitted === 'boolean'
        ? (it as { omitted: boolean }).omitted
        : !!(it as { omitted?: boolean })?.omitted;
    if (typeof reportId === 'number') {
      normalized.push({ reportId, omitted });
    }
  }
  return normalized.length > 0 ? normalized : undefined;
}
