import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { PERMISSIONS } from '@corpcal/shared/auth';
import { fetchActiveRecurringLockoutBannerState } from '@/api/bannerApi';

import {
  RECURRING_LOCKOUT_BANNER_QUERY_KEY,
  useRecurringEditLockout,
  useRecurringLockoutBanner,
} from './useRecurringLockoutBanner';

vi.mock('@/api/bannerApi', () => ({
  fetchActiveRecurringLockoutBannerState: vi.fn(),
}));

const fetchActiveRecurringLockoutBannerStateMock = vi.mocked(
  fetchActiveRecurringLockoutBannerState
);

function createWrapper(queryClient: QueryClient) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return Wrapper;
}

describe('useRecurringLockoutBanner', () => {
  it('returns the active banner from the API response', async () => {
    fetchActiveRecurringLockoutBannerStateMock.mockResolvedValue({
      banner: {
        id: 1,
        isActive: true,
        leadContent:
          'Updates to activities will be locked <lockStartTime> - <lockEndTime> PT.',
        activeContent:
          'Updates to activities are locked out until <lockEndTime> PT.',
        content: 'Updates to activities will be locked 2:00 pm - 4:00 pm PT.',
        phase: 'lead-up',
        backgroundColor: '#E6A635',
        textColor: '#000000',
        variant: 'warning',
        startTimeOfDay: '14:00',
        endTimeOfDay: '16:00',
        bannerLeadMinutes: 20,
        createdDateTime: '2026-08-05T18:00:00.000Z',
        lastUpdatedDateTime: '2026-08-05T18:00:00.000Z',
      },
      schedule: {
        isActive: true,
        startTimeOfDay: '14:00',
        endTimeOfDay: '16:00',
        bannerLeadMinutes: 20,
      },
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(() => useRecurringLockoutBanner(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current?.content).toBe(
        'Updates to activities will be locked 2:00 pm - 4:00 pm PT.'
      );
    });
  });

  it('schedules invalidation at the next banner boundary', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    try {
      vi.setSystemTime(new Date('2026-08-05T20:39:00.000Z'));

      fetchActiveRecurringLockoutBannerStateMock.mockResolvedValue({
        banner: null,
        schedule: {
          isActive: true,
          startTimeOfDay: '14:00',
          endTimeOfDay: '16:00',
          bannerLeadMinutes: 20,
        },
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      renderHook(() => useRecurringLockoutBanner(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(61_000);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: RECURRING_LOCKOUT_BANNER_QUERY_KEY,
      });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('useRecurringEditLockout', () => {
  it('reports isBlocked during the active lockout window without bypass permission', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    try {
      vi.setSystemTime(new Date('2026-08-05T16:00:00.000Z'));

      fetchActiveRecurringLockoutBannerStateMock.mockResolvedValue({
        banner: null,
        schedule: {
          isActive: true,
          startTimeOfDay: '09:00',
          endTimeOfDay: '10:00',
          bannerLeadMinutes: 20,
        },
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      const { result } = renderHook(
        () => useRecurringEditLockout([PERMISSIONS.ACTIVITIES.EDIT]),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isBlocked).toBe(true);
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not block users with bypass permission during the lockout window', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    try {
      vi.setSystemTime(new Date('2026-08-05T16:00:00.000Z'));

      fetchActiveRecurringLockoutBannerStateMock.mockResolvedValue({
        banner: null,
        schedule: {
          isActive: true,
          startTimeOfDay: '09:00',
          endTimeOfDay: '10:00',
          bannerLeadMinutes: 20,
        },
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      const { result } = renderHook(
        () =>
          useRecurringEditLockout([
            PERMISSIONS.ACTIVITIES.BYPASS_RECURRING_LOCKOUT,
          ]),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isBlocked).toBe(false);
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
