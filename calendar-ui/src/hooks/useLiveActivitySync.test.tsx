import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReactNode } from 'react';

import {
  __resetLiveActivitySyncForTests,
  LIVE_ACTIVITY_REFRESH_DEBOUNCE_MS,
} from '@/lib/liveActivitySync';

import { useLiveActivitySync } from './useLiveActivitySync';

const { getFakeSocket } = vi.hoisted(() => {
  const listeners = new Map<string, (data: unknown) => void>();
  const managerListeners = new Map<string, () => void>();
  const socket = {
    on: vi.fn((event: string, cb: (data: unknown) => void) => {
      listeners.set(event, cb);
      return socket;
    }),
    emit: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
    io: {
      on: vi.fn((event: string, cb: () => void) => {
        managerListeners.set(event, cb);
        return socket.io;
      }),
      off: vi.fn((event: string, cb: () => void) => {
        if (managerListeners.get(event) === cb) {
          managerListeners.delete(event);
        }
        return socket.io;
      }),
    },
    emitEvent(event: string, data: unknown) {
      const cb = listeners.get(event);
      if (cb) cb(data);
    },
    emitManagerEvent(event: string) {
      const cb = managerListeners.get(event);
      if (cb) cb();
    },
  };
  return { getFakeSocket: () => socket };
});

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => getFakeSocket()),
}));

function Providers({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function TestWrapper() {
  useLiveActivitySync();
  return null;
}

describe('useLiveActivitySync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    __resetLiveActivitySyncForTests();
  });

  afterEach(() => {
    __resetLiveActivitySyncForTests();
    vi.useRealTimers();
  });

  describe('activityCreated', () => {
    it('debounces invalidateQueries for reports and activities', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      render(
        <Providers queryClient={queryClient}>
          <TestWrapper />
        </Providers>
      );

      getFakeSocket().emitEvent('activityCreated', { activityId: 1 });

      await vi.advanceTimersByTimeAsync(LIVE_ACTIVITY_REFRESH_DEBOUNCE_MS / 2);
      expect(invalidateSpy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(
        LIVE_ACTIVITY_REFRESH_DEBOUNCE_MS / 2 + 1
      );
      expect(invalidateSpy).toHaveBeenCalled();

      invalidateSpy.mockRestore();
    });
  });

  describe('activityUpdated', () => {
    it('debounces invalidateQueries when activityUpdated fires', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      render(
        <Providers queryClient={queryClient}>
          <TestWrapper />
        </Providers>
      );
      getFakeSocket().emitEvent('activityUpdated', { activityId: 1 });

      await vi.advanceTimersByTimeAsync(LIVE_ACTIVITY_REFRESH_DEBOUNCE_MS + 1);
      expect(invalidateSpy).toHaveBeenCalled();

      invalidateSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('calls off and disconnect on unmount', () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
      });

      const { unmount } = render(
        <Providers queryClient={queryClient}>
          <TestWrapper />
        </Providers>
      );
      const socket = getFakeSocket();
      unmount();

      expect(socket.emit).toHaveBeenCalledWith('unsubscribeFromActivities');
      expect(socket.off).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(socket.io.off).toHaveBeenCalledWith(
        'reconnect',
        expect.any(Function)
      );
      expect(socket.off).toHaveBeenCalledWith(
        'activityCreated',
        expect.any(Function)
      );
      expect(socket.off).toHaveBeenCalledWith(
        'activityUpdated',
        expect.any(Function)
      );
      expect(socket.disconnect).toHaveBeenCalled();
    });
  });

  describe('subscription', () => {
    it('subscribes on connect and on manager reconnect', () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
      });

      render(
        <Providers queryClient={queryClient}>
          <TestWrapper />
        </Providers>
      );
      const socket = getFakeSocket();

      socket.emitEvent('connect', undefined);
      expect(socket.emit).toHaveBeenCalledWith('subscribeToActivities');

      vi.mocked(socket.emit).mockClear();
      socket.emitManagerEvent('reconnect');
      expect(socket.emit).toHaveBeenCalledWith('subscribeToActivities');
    });
  });
});
