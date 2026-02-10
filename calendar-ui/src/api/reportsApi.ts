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

export async function fetchLookAheadData(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<LookAheadResponse> {
  const response = await api.get<LookAheadResponse>('/look-ahead', {
    params,
  });
  return response.data;
}
