import type {
  ActivityResponse,
  ReportResponse,
} from '@corpcal/shared/api/types';
import type { ReportDataQueryParams } from '@corpcal/shared/schemas';

import api from './axios';

export interface LookAheadSectionData {
  id: string;
  name: string;
  order: number;
  activities: ActivityResponse[];
}

export interface LookAheadResponse {
  report: ReportResponse | null;
  sections: LookAheadSectionData[];
}

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

export async function fetchLookAheadData(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<LookAheadResponse> {
  const response = await api.get<LookAheadResponse>('/look-ahead', {
    params,
  });
  return response.data;
}

/** Query params for `/reports/data/:type` and CSV export (strings as sent in the URL). */
export type ReportDataRequestParams = Partial<ReportDataQueryParams>;

export async function fetchReportData(
  type: string,
  params?: ReportDataRequestParams
): Promise<ReportDataResponse> {
  const response = await api.get<ReportDataResponse>(`/reports/data/${type}`, {
    params,
  });
  return response.data;
}

export async function fetchReportsList(): Promise<ReportResponse[]> {
  const response = await api.get<ReportResponse[]>('/reports');
  return response.data;
}

export type ReportExportFormat = 'csv' | 'xlsx' | 'pdf';

const EXPORT_EXT: Record<ReportExportFormat, string> = {
  csv: 'csv',
  xlsx: 'xlsx',
  pdf: 'pdf',
};

/**
 * Download a report export (same query params as {@link fetchReportData}).
 * Uses shared server-side formatters; not tied to a specific page layout.
 */
export async function downloadReportExport(
  type: string,
  format: ReportExportFormat,
  params?: ReportDataRequestParams
): Promise<void> {
  const ext = EXPORT_EXT[format];
  const response = await api.get(`/reports/export/${type}/${ext}`, {
    params,
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${type}-report.${ext}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadReportCsv(
  type: string,
  params?: ReportDataRequestParams
): Promise<void> {
  return downloadReportExport(type, 'csv', params);
}
