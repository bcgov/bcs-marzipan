import { useQuery } from '@tanstack/react-query';

import {
  fetchAllLegacyActivities,
  fetchLegacyActivity,
} from '@/api/legacyActivitiesApi';

export function useLegacyActivities(enabled: boolean) {
  return useQuery({
    queryKey: ['legacy-activities', 'all'],
    queryFn: fetchAllLegacyActivities,
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
