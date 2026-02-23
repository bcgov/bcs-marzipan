import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLookAheadWebSocket } from './useLookAheadWebSocket';

const { getFakeSocket } = vi.hoisted(() => {
  const listeners = new Map<string, (data: unknown) => void>();
  const socket = {
    on: vi.fn((event: string, cb: (data: unknown) => void) => {
      listeners.set(event, cb);
      return socket;
    }),
    emit: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
    emitEvent(event: string, data: unknown) {
      const cb = listeners.get(event);
      if (cb) cb(data);
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
      getFakeSocket().emitEvent('activityCreated', { id: 1, title: 'Test' });

      expect(onActivityUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('activityUpdated', () => {
    it('calls onActivityUpdate when activityUpdated fires', () => {
      const onActivityUpdate = vi.fn();
      render(<TestWrapper onActivityUpdate={onActivityUpdate} />);
      getFakeSocket().emitEvent('activityUpdated', { id: 1, title: 'Test' });

      expect(onActivityUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('calls off and disconnect on unmount', () => {
      const { unmount } = render(<TestWrapper />);
      const socket = getFakeSocket();
      unmount();

      expect(socket.emit).toHaveBeenCalledWith('unsubscribeFromActivities');
      expect(socket.off).toHaveBeenCalledWith('activityCreated');
      expect(socket.off).toHaveBeenCalledWith('activityUpdated');
      expect(socket.disconnect).toHaveBeenCalled();
    });
  });
});
