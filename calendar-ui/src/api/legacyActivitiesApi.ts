import api from './axios';

export type LegacyActivityListQuery = {
  search?: string;
  status?: string;
  archived?: boolean;
  sourceSystem?: string;
  limit?: number;
  offset?: number;
};

export type LegacyActivityListItem = {
  id: number;
  sourceSystem: string;
  sourceTable: string;
  sourceRecordId: string;
  title: string | null;
  summary: string | null;
  startDate: string | null;
  endDate: string | null;
  statusName: string | null;
  lookAheadStatus: string | null;
  leadOrgName: string | null;
  ministryName: string | null;
  locationName: string | null;
  importedAt: string | null;
  isArchived: boolean;
};

export async function fetchLegacyActivities(
  query: LegacyActivityListQuery
): Promise<LegacyActivityListItem[]> {
  const params: Record<string, string | number | boolean> = {};

  if (query.search?.trim()) params.search = query.search.trim();
  if (query.status?.trim()) params.status = query.status.trim();
  if (typeof query.archived === 'boolean') params.archived = query.archived;
  if (query.sourceSystem?.trim())
    params.sourceSystem = query.sourceSystem.trim();
  if (typeof query.limit === 'number') params.limit = query.limit;
  if (typeof query.offset === 'number') params.offset = query.offset;

  const res = await api.get('/legacy-activities', { params });

  if (Array.isArray(res.data)) {
    return res.data as LegacyActivityListItem[];
  }

  if (
    res.data &&
    typeof res.data === 'object' &&
    'data' in res.data &&
    Array.isArray((res.data as { data?: unknown }).data)
  ) {
    return (res.data as { data: LegacyActivityListItem[] }).data;
  }

  return [];
}
