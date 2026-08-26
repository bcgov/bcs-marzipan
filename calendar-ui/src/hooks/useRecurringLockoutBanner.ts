import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
  getMsUntilNextRecurringLockoutBoundary,
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
export const RECURRING_LOCKOUT_BOUNDARY_SETTLE_MS = 250;

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

/**
 * Timestamp that advances at each lockout/banner boundary, on focus, and on tab
 * visibility. Time-derived lockout state must be computed from this value rather
 * than from `Date.now()` at render: the returned timestamp is the only reactive
 * input that tells React (and the React Compiler's memo caches) that the wall
 * clock crossed a boundary.
 */
function useRecurringLockoutBoundaryClock(
  schedule: RecurringLockoutBannerScheduleSlice | null
): number {
  const queryClient = useQueryClient();
  const [boundaryNowMs, setBoundaryNowMs] = useState(() => Date.now());
  const scheduleKey = getScheduleKey(schedule);

  useEffect(() => {
    if (!schedule?.isActive || scheduleKey == null) {
      return;
    }

    const delayMs = getMsUntilNextRecurringLockoutBoundary(schedule);
    if (delayMs == null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setBoundaryNowMs(Date.now());
      void queryClient.invalidateQueries({
        queryKey: RECURRING_LOCKOUT_BANNER_QUERY_KEY,
      });
    }, delayMs + RECURRING_LOCKOUT_BOUNDARY_SETTLE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [boundaryNowMs, queryClient, schedule, scheduleKey]);

  useEffect(() => {
    const resync = (): void => {
      if (document.visibilityState === 'visible') {
        setBoundaryNowMs(Date.now());
      }
    };
    window.addEventListener('focus', resync);
    document.addEventListener('visibilitychange', resync);
    return () => {
      window.removeEventListener('focus', resync);
      document.removeEventListener('visibilitychange', resync);
    };
  }, []);

  return boundaryNowMs;
}

function useRecurringLockoutBannerQuery() {
  const { data } = useQuery({
    queryKey: RECURRING_LOCKOUT_BANNER_QUERY_KEY,
    queryFn: fetchActiveRecurringLockoutBannerState,
    staleTime: 30_000,
    refetchInterval: RECURRING_LOCKOUT_BANNER_FALLBACK_REFETCH_MS,
  });

  const schedule = data?.schedule ?? null;
  const boundaryNowMs = useRecurringLockoutBoundaryClock(schedule);

  return {
    banner: data?.banner ?? null,
    schedule,
    boundaryNowMs,
  };
}

/**
 * Recurring edit lockout schedule and whether the current user is blocked from editing.
 */
export function useRecurringEditLockout(
  permissions: readonly string[]
): RecurringEditLockoutState {
  const { banner, schedule, boundaryNowMs } = useRecurringLockoutBannerQuery();

  /*
   * `boundaryNowMs` must be passed explicitly. Letting
   * `isUserBlockedByRecurringEditLockout` fall back to its internal `Date.now()`
   * hides time from React and from the React Compiler, which caches this value
   * against `schedule` and `permissions` only. Both stay reference-stable across
   * a boundary (React Query structural sharing preserves `schedule`), so the
   * cached result would survive the boundary re-render and the page would never
   * enter or leave the lockout window without a full reload.
   */
  const isBlocked =
    schedule != null &&
    isUserBlockedByRecurringEditLockout(schedule, permissions, boundaryNowMs);

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
