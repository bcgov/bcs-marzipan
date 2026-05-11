import api from './axios';

export type ReportCoverContactSettings = {
  contactPhone: string;
  contactEmail: string;
};

export async function fetchReportCoverContactSettings(): Promise<ReportCoverContactSettings> {
  const res = await api.get<{
    success: boolean;
    data: ReportCoverContactSettings;
  }>('/settings/report-cover-contact');
  return res.data.data;
}

export async function patchReportCoverContactSettings(
  body: ReportCoverContactSettings
): Promise<ReportCoverContactSettings> {
  const res = await api.patch<{
    success: boolean;
    data: ReportCoverContactSettings;
  }>('/settings/report-cover-contact', body);
  return res.data.data;
}
