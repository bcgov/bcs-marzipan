import { useQuery } from '@tanstack/react-query';

import {
  fetchAllLegacyActivities,
  fetchLegacyActivity,
  type LegacyActivityListQuery,
} from '@/api/legacyActivitiesApi';

export function useLegacyActivities(
  enabled: boolean,
  query: Omit<LegacyActivityListQuery, 'limit' | 'offset'> = {}
) {
  return useQuery({
    queryKey: ['legacy-activities', query],
    queryFn: () => fetchAllLegacyActivities(query),
    enabled,
  });
}

export function useLegacyActivity(id: number) {
  return useQuery({
    queryKey: ['legacy-activity', id],
    queryFn: () => fetchLegacyActivity(id),
    enabled: Number.isFinite(id),
  });
}
