import type { ActivityResponse } from '../schemas/activity-response.schema';
import type { ReportResponse } from '../schemas/lookup.schema';

/** Report payload returned by `GET /reports/data/:type` (sections + activities). */
export interface ReportSectionData {
  id: string;
  name: string;
  order: number;
  activities: ActivityResponse[];
}

export interface ReportDataResponse {
  report: ReportResponse;
  sections: ReportSectionData[];
}
