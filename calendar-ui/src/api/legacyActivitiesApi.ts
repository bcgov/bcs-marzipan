import api from './axios';

export type LegacyActivityListQuery = {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};

export type LegacyActivity = {
  id: number;
  displayId: string;
  title: string | null;
  summary: string | null;
  startDate: string | null;
  endDate: string | null;
  activityStatusId: number;
  activityStatus: string;
  lookAheadStatus: string | null;
  leadOrgName: string | null;
  ministryName: string | null;
  locationName: string | null;
  commsMaterials: string[];
  translations: string[];
  commsContactName: string | null;
  createdDateTime: string | null;
  importedAt: string | null;
};

export type LegacyActivityDetails = LegacyActivity & {
  overview: {
    category: string[];
    confidential: boolean | null;
    issue: boolean | null;
    tags: string[];
    significance: string | null;
    notes?: string | null;
  };
  lookAhead?: {
    executiveSummary: string | null;
  };
  comms: {
    materials: string[];
    newsReleaseOrigin: string | null;
    newsReleaseDistribution: string | null;
    translations: string[];
  };
  event: {
    premierStatus: string | null;
    governmentRepresentatives: string[];
    eventPlanners: string[];
    venueCity: string | null;
  };
};

export async function fetchLegacyActivities(
  query: LegacyActivityListQuery
): Promise<LegacyActivity[]> {
  const params: Record<string, string | number | boolean> = {};

  if (query.search?.trim()) params.search = query.search.trim();
  if (query.status?.trim()) params.status = query.status.trim();
  if (query.startDate?.trim()) params.startDate = query.startDate.trim();
  if (query.endDate?.trim()) params.endDate = query.endDate.trim();
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

/** Pages through the server-filtered legacy result set until all matches are loaded. */
export async function fetchAllLegacyActivities(
  query: Omit<LegacyActivityListQuery, 'limit' | 'offset'> = {}
): Promise<LegacyActivity[]> {
  const all: LegacyActivity[] = [];
  for (let offset = 0; ; offset += LEGACY_PAGE_SIZE) {
    const page = await fetchLegacyActivities({
      ...query,
      limit: LEGACY_PAGE_SIZE,
      offset,
    });
    all.push(...page);
    if (page.length < LEGACY_PAGE_SIZE) break;
  }
  return all;
}

export async function fetchLegacyActivity(
  id: number
): Promise<LegacyActivityDetails> {
  const res = await api.get<LegacyActivityDetails>(`/legacy-activities/${id}`);
  return res.data;
}
