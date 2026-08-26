import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
  getNextRecurringLockoutBannerBoundaryMs,
  isUserBlockedByRecurringEditLockout,
  type RecurringLockoutBannerScheduleSlice,
} from '@corpcal/shared';
import type { ActiveRecurringLockoutBanner } from '@corpcal/shared/api/types';
import { fetchActiveRecurringLockoutBannerState } from '@/api/bannerApi';

export const RECURRING_LOCKOUT_BANNER_QUERY_KEY = [
  'banner',
  'recurring-lockout',
  'active',
] as const;

const RECURRING_LOCKOUT_BANNER_FALLBACK_REFETCH_MS = 60_000;
export const RECURRING_LOCKOUT_BOUNDARY_INVALIDATION_BUFFER_MS = 250;

export type RecurringEditLockoutState = {
  isBlocked: boolean;
  schedule: RecurringLockoutBannerScheduleSlice | null;
  banner: ActiveRecurringLockoutBanner | null;
};

function getScheduleKey(
  schedule: RecurringLockoutBannerScheduleSlice | null
): string | null {
  return schedule
    ? `${schedule.isActive}:${schedule.startTimeOfDay}:${schedule.endTimeOfDay}:${schedule.bannerLeadMinutes}`
    : null;
}

/** Forces a re-render at the next lockout/banner boundary so client isBlocked stays in sync with the clock. */
function useRecurringLockoutBoundaryClock(
  schedule: RecurringLockoutBannerScheduleSlice | null
): void {
  const [boundaryEpoch, setBoundaryEpoch] = useState(0);
  const scheduleKey = getScheduleKey(schedule);

  useEffect(() => {
    if (!schedule?.isActive || scheduleKey == null) {
      return;
    }

    const delayMs = getNextRecurringLockoutBannerBoundaryMs(schedule);
    if (delayMs == null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setBoundaryEpoch((epoch) => epoch + 1);
      // Re-check one second later: timer can fire just before the Pacific minute rolls over,
      // leaving isBlocked stale until the next boundary (lockout end).
      window.setTimeout(() => {
        setBoundaryEpoch((epoch) => epoch + 1);
      }, 1000);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [boundaryEpoch, schedule, scheduleKey]);
}

function useRecurringLockoutBannerQuery() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: RECURRING_LOCKOUT_BANNER_QUERY_KEY,
    queryFn: fetchActiveRecurringLockoutBannerState,
    staleTime: 30_000,
    refetchInterval: RECURRING_LOCKOUT_BANNER_FALLBACK_REFETCH_MS,
  });

  const schedule = data?.schedule ?? null;
  const scheduleKey = getScheduleKey(schedule);

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
    }, delayMs + RECURRING_LOCKOUT_BOUNDARY_INVALIDATION_BUFFER_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [data?.banner, queryClient, schedule, scheduleKey]);

  return {
    banner: data?.banner ?? null,
    schedule,
  };
}

/**
 * Recurring edit lockout schedule and whether the current user is blocked from editing.
 */
export function useRecurringEditLockout(
  permissions: readonly string[]
): RecurringEditLockoutState {
  const { banner, schedule } = useRecurringLockoutBannerQuery();
  useRecurringLockoutBoundaryClock(schedule);

  const isBlocked =
    schedule != null &&
    isUserBlockedByRecurringEditLockout(schedule, permissions);

  return {
    isBlocked,
    schedule,
    banner,
  };
}

export function useRecurringLockoutBanner(): ActiveRecurringLockoutBanner | null {
  const { banner } = useRecurringLockoutBannerQuery();
  return banner;
}
