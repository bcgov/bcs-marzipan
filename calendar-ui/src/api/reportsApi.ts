import type { ActivityResponse } from '@corpcal/shared/api/types';
import type { ReportDataQueryParams } from '@corpcal/shared/schemas';
import type { ReportResponse } from '@corpcal/shared/schemas/lookup.schema';

import api from './axios';

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

/** Query params for `/reports/data/:type` and CSV/XLSX/PDF export (strings as sent in the URL). */
export type ReportDataRequestParams = Partial<ReportDataQueryParams>;

/**
 * Server PDF path uses Puppeteer; first render or large reports can exceed the
 * shared axios default (30s). CSV/XLSX stay on that default — quick serialization.
 */
const REPORT_PDF_EXPORT_TIMEOUT_MS = 60_000;

export async function fetchReportData(
  type: string,
  params?: ReportDataRequestParams
): Promise<ReportDataResponse> {
  const response = await api.get<ReportDataResponse>(`/reports/data/${type}`, {
    params,
  });
  return response.data;
}

async function downloadReportFile(
  type: string,
  ext: 'csv' | 'xlsx' | 'pdf',
  params?: ReportDataRequestParams
): Promise<void> {
  const response = await api.get(`/reports/export/${type}/${ext}`, {
    params,
    responseType: 'blob',
    timeout: ext === 'pdf' ? REPORT_PDF_EXPORT_TIMEOUT_MS : undefined,
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

/** Download CSV (`GET /reports/export/:type/csv`). Same query params as `fetchReportData`. */
export async function downloadReportCsv(
  type: string,
  params?: ReportDataRequestParams
): Promise<void> {
  return downloadReportFile(type, 'csv', params);
}

/** Download XLSX (`GET /reports/export/:type/xlsx`). Same query params as `fetchReportData`. */
export async function downloadReportXlsx(
  type: string,
  params?: ReportDataRequestParams
): Promise<void> {
  return downloadReportFile(type, 'xlsx', params);
}

/** Download PDF (`GET /reports/export/:type/pdf`). Same query params as `fetchReportData`. */
export async function downloadReportPdf(
  type: string,
  params?: ReportDataRequestParams
): Promise<void> {
  return downloadReportFile(type, 'pdf', params);
}
