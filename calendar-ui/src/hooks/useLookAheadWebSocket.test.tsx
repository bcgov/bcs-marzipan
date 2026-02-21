import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLookAheadWebSocket } from './useLookAheadWebSocket';

const { mockToast, getFakeSocket } = vi.hoisted(() => {
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
  return {
    mockToast: { success: vi.fn(), info: vi.fn() },
    getFakeSocket: () => socket,
  };
});

vi.mock('sonner', () => ({ toast: mockToast }));

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
    it('calls toast.success with id activity-created-{id} and description', () => {
      render(<TestWrapper />);
      getFakeSocket().emitEvent('activityCreated', {
        id: 1,
        displayId: 'ACT-1',
        title: 'Test Activity',
      });

      expect(mockToast.success).toHaveBeenCalledTimes(1);
      expect(mockToast.success).toHaveBeenCalledWith('New activity created', {
        id: 'activity-created-1',
        description: 'ACT-1: Test Activity',
        duration: 5000,
      });
      expect(mockToast.info).not.toHaveBeenCalled();
    });

    it('uses title only when displayId is missing', () => {
      render(<TestWrapper />);
      getFakeSocket().emitEvent('activityCreated', {
        id: 42,
        title: 'Only Title',
      });

      expect(mockToast.success).toHaveBeenCalledWith('New activity created', {
        id: 'activity-created-42',
        description: 'Only Title',
        duration: 5000,
      });
    });

    it('calls onActivityUpdate when activityCreated fires', () => {
      const onActivityUpdate = vi.fn();
      render(<TestWrapper onActivityUpdate={onActivityUpdate} />);
      getFakeSocket().emitEvent('activityCreated', { id: 1, title: 'Test' });

      expect(onActivityUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('activityUpdated', () => {
    it('calls toast.info with id activity-updated-{id} and description', () => {
      render(<TestWrapper />);
      getFakeSocket().emitEvent('activityUpdated', {
        id: 1,
        displayId: 'ACT-1',
        title: 'Updated Title',
      });

      expect(mockToast.info).toHaveBeenCalledTimes(1);
      expect(mockToast.info).toHaveBeenCalledWith('Activity updated', {
        id: 'activity-updated-1',
        description: 'ACT-1: Updated Title',
        duration: 5000,
      });
      expect(mockToast.success).not.toHaveBeenCalled();
    });

    it('uses ACT-{id} prefix when displayId is missing (shared utility format)', () => {
      render(<TestWrapper />);
      getFakeSocket().emitEvent('activityUpdated', {
        id: 99,
        title: 'No displayId',
      });

      expect(mockToast.info).toHaveBeenCalledWith('Activity updated', {
        id: 'activity-updated-99',
        description: 'ACT-99: No displayId',
        duration: 5000,
      });
    });

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
