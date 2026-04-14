import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLookAheadWebSocket } from './useLookAheadWebSocket';

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

function TestWrapper({ onActivityUpdate }: { onActivityUpdate?: () => void }) {
  useLookAheadWebSocket({ onActivityUpdate });
  return null;
}

describe('useLookAheadWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('activityCreated', () => {
    it('calls onActivityUpdate when activityCreated fires', () => {
      const onActivityUpdate = vi.fn();
      render(<TestWrapper onActivityUpdate={onActivityUpdate} />);
      getFakeSocket().emitEvent('activityCreated', { activityId: 1 });

      expect(onActivityUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('activityUpdated', () => {
    it('calls onActivityUpdate when activityUpdated fires', () => {
      const onActivityUpdate = vi.fn();
      render(<TestWrapper onActivityUpdate={onActivityUpdate} />);
      getFakeSocket().emitEvent('activityUpdated', { activityId: 1 });

      expect(onActivityUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('calls off and disconnect on unmount', () => {
      const { unmount } = render(<TestWrapper />);
      const socket = getFakeSocket();
      unmount();

      expect(socket.emit).toHaveBeenCalledWith('unsubscribeFromActivities');
      expect(socket.off).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(socket.io.off).toHaveBeenCalledWith(
        'reconnect',
        expect.any(Function)
      );
      expect(socket.off).toHaveBeenCalledWith('activityCreated');
      expect(socket.off).toHaveBeenCalledWith('activityUpdated');
      expect(socket.disconnect).toHaveBeenCalled();
    });
  });

  describe('subscription', () => {
    it('subscribes on connect and on manager reconnect', () => {
      render(<TestWrapper />);
      const socket = getFakeSocket();

      socket.emitEvent('connect', undefined);
      expect(socket.emit).toHaveBeenCalledWith('subscribeToActivities');

      vi.mocked(socket.emit).mockClear();
      socket.emitManagerEvent('reconnect');
      expect(socket.emit).toHaveBeenCalledWith('subscribeToActivities');
    });
  });
});
