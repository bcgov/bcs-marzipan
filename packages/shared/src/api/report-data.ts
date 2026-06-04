import type {
  InferredReportDateBound,
  ReportDateRange,
} from '../reports/normalizeReportActivityDateRange';
import type { ReportActivityRow } from '../schemas/activity-list-item.schema';
import type { ReportResponse } from '../schemas/lookup.schema';

/** Report payload returned by `GET /reports/data/:type` (sections + activities). */
export interface ReportSectionData {
  id: string;
  name: string;
  order: number;
  activities: ReportActivityRow[];
}

export interface ReportDataMeta {
  resolvedDateRange: ReportDateRange;
  wasClamped: boolean;
  inferredBound: InferredReportDateBound;
  activityCount: number;
  largeResultWarning: boolean;
}

export interface ReportDataResponse {
  report: ReportResponse;
  sections: ReportSectionData[];
  meta?: ReportDataMeta;
}
