import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useActivityWebSocket } from './useActivityWebSocket';

const { getFakeSocket } = vi.hoisted(() => {
  const socketListeners = new Map<string, (payload?: unknown) => void>();
  const managerListeners = new Map<string, () => void>();
  const socket = {
    on: vi.fn((event: string, callback: (payload?: unknown) => void) => {
      socketListeners.set(event, callback);
      return socket;
    }),
    off: vi.fn((event: string) => {
      socketListeners.delete(event);
      return socket;
    }),
    emit: vi.fn(),
    disconnect: vi.fn(),
    io: {
      on: vi.fn((event: string, callback: () => void) => {
        managerListeners.set(event, callback);
      }),
      off: vi.fn((event: string) => {
        managerListeners.delete(event);
      }),
    },
    emitSocketEvent(event: string, payload?: unknown) {
      socketListeners.get(event)?.(payload);
    },
    emitManagerEvent(event: string) {
      managerListeners.get(event)?.();
    },
  };

  return { getFakeSocket: () => socket };
});

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => getFakeSocket()),
}));

function TestHarness({
  onActivitySocketReconnect,
}: {
  onActivitySocketReconnect: () => void;
}) {
  useActivityWebSocket(139, { onActivitySocketReconnect });
  return null;
}

describe('useActivityWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resubscribes on connect but invokes resync only once per manager reconnect', () => {
    const onActivitySocketReconnect = vi.fn();
    render(
      <TestHarness onActivitySocketReconnect={onActivitySocketReconnect} />
    );

    const socket = getFakeSocket();
    socket.emitSocketEvent('connect');
    expect(onActivitySocketReconnect).not.toHaveBeenCalled();

    socket.emitManagerEvent('reconnect');
    expect(onActivitySocketReconnect).toHaveBeenCalledTimes(1);
    expect(socket.emit).toHaveBeenCalledTimes(2);
    expect(socket.emit).toHaveBeenNthCalledWith(1, 'viewActivity', 139);
    expect(socket.emit).toHaveBeenNthCalledWith(2, 'viewActivity', 139);
  });
});
