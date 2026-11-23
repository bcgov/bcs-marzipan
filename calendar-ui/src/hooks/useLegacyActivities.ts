import { useQuery } from '@tanstack/react-query';

import { fetchAllLegacyActivities } from '@/api/legacyActivitiesApi';

export function useLegacyActivities(enabled: boolean) {
  return useQuery({
    queryKey: ['legacy-activities', 'all'],
    queryFn: fetchAllLegacyActivities,
    enabled,
  });
}
