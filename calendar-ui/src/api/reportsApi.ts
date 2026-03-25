import type {
  ActivityResponse,
  ReportResponse,
} from '@corpcal/shared/api/types';

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

export async function fetchReportData(
  type: string,
  params?: {
    startDate?: string;
    endDate?: string;
  }
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

export async function downloadReportCsv(
  type: string,
  params?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<void> {
  const response = await api.get(`/reports/export/${type}/csv`, {
    params,
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${type}-report.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
