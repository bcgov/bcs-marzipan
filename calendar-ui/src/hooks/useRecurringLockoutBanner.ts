import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getNextRecurringLockoutBannerBoundaryMs } from '@corpcal/shared';
import type { RecurringLockoutBannerSettings } from '@corpcal/shared/api/types';
import { fetchActiveRecurringLockoutBannerState } from '@/api/bannerApi';

export const RECURRING_LOCKOUT_BANNER_QUERY_KEY = [
  'banner',
  'recurring-lockout',
  'active',
] as const;

const RECURRING_LOCKOUT_BANNER_FALLBACK_REFETCH_MS = 60_000;
const BOUNDARY_INVALIDATION_BUFFER_MS = 1_000;

export function useRecurringLockoutBanner(): RecurringLockoutBannerSettings | null {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: RECURRING_LOCKOUT_BANNER_QUERY_KEY,
    queryFn: fetchActiveRecurringLockoutBannerState,
    staleTime: 30_000,
    refetchInterval: RECURRING_LOCKOUT_BANNER_FALLBACK_REFETCH_MS,
  });

  const schedule = data?.schedule ?? null;
  const scheduleKey = schedule
    ? `${schedule.isActive}:${schedule.startTimeOfDay}:${schedule.endTimeOfDay}:${schedule.bannerLeadMinutes}`
    : null;

  useEffect(() => {
    if (!schedule?.isActive || scheduleKey == null) {
      return;
    }

    const delayMs = getNextRecurringLockoutBannerBoundaryMs(schedule);
    if (delayMs == null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void queryClient.invalidateQueries({
        queryKey: RECURRING_LOCKOUT_BANNER_QUERY_KEY,
      });
    }, delayMs + BOUNDARY_INVALIDATION_BUFFER_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [data?.banner, queryClient, schedule, scheduleKey]);

  return data?.banner ?? null;
}
