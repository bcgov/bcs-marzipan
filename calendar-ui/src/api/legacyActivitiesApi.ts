import api from './axios';

export type LegacyActivityListQuery = {
  search?: string;
  status?: string;
  archived?: boolean;
  sourceSystem?: string;
  limit?: number;
  offset?: number;
};

export type LegacyActivity = {
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
): Promise<LegacyActivity[]> {
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
    return res.data as LegacyActivity[];
  }

  if (
    res.data &&
    typeof res.data === 'object' &&
    'data' in res.data &&
    Array.isArray((res.data as { data?: unknown }).data)
  ) {
    return (res.data as { data: LegacyActivity[] }).data;
  }

  return [];
}

const LEGACY_PAGE_SIZE = 100;
const LEGACY_MAX_ROWS = 2000;

/** Pages through the list endpoint (server caps page size at 100) up to a safety limit. */
export async function fetchAllLegacyActivities(): Promise<LegacyActivity[]> {
  const all: LegacyActivity[] = [];
  for (let offset = 0; offset < LEGACY_MAX_ROWS; offset += LEGACY_PAGE_SIZE) {
    const page = await fetchLegacyActivities({
      limit: LEGACY_PAGE_SIZE,
      offset,
    });
    all.push(...page);
    if (page.length < LEGACY_PAGE_SIZE) break;
  }
  return all;
}

export async function fetchLegacyActivity(id: number): Promise<LegacyActivity> {
  const res = await api.get<LegacyActivity>(`/legacy-activities/${id}`);
  return res.data;
}
