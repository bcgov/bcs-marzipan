import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBannerSettingsWebSocket } from './useBannerSettingsWebSocket';

const { getFakeSocket } = vi.hoisted(() => {
  const listeners = new Map<string, () => void>();
  const socket = {
    on: vi.fn((event: string, cb: () => void) => {
      listeners.set(event, cb);
      return socket;
    }),
    off: vi.fn((event: string) => {
      listeners.delete(event);
      return socket;
    }),
    disconnect: vi.fn(),
    emitEvent(event: string) {
      listeners.get(event)?.();
    },
  };

  return { getFakeSocket: () => socket };
});

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => getFakeSocket()),
}));

function TestHarness({
  onSystemBannerSettingsUpdated,
  onRecurringLockoutBannerSettingsUpdated,
}: {
  onSystemBannerSettingsUpdated?: () => void;
  onRecurringLockoutBannerSettingsUpdated?: () => void;
}) {
  useBannerSettingsWebSocket({
    onSystemBannerSettingsUpdated,
    onRecurringLockoutBannerSettingsUpdated,
  });
  return null;
}

describe('useBannerSettingsWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes callbacks for both banner update events', () => {
    const onSystemBannerSettingsUpdated = vi.fn();
    const onRecurringLockoutBannerSettingsUpdated = vi.fn();

    render(
      <TestHarness
        onSystemBannerSettingsUpdated={onSystemBannerSettingsUpdated}
        onRecurringLockoutBannerSettingsUpdated={
          onRecurringLockoutBannerSettingsUpdated
        }
      />
    );

    const socket = getFakeSocket();
    socket.emitEvent('systemBannerSettingsUpdated');
    socket.emitEvent('recurringLockoutBannerSettingsUpdated');

    expect(onSystemBannerSettingsUpdated).toHaveBeenCalledTimes(1);
    expect(onRecurringLockoutBannerSettingsUpdated).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes from events and disconnects on unmount', () => {
    const socket = getFakeSocket();
    const disconnectCallsBefore = socket.disconnect.mock.calls.length;
    const { unmount } = render(<TestHarness />);

    unmount();

    expect(socket.off).toHaveBeenCalledWith('systemBannerSettingsUpdated');
    expect(socket.off).toHaveBeenCalledWith(
      'recurringLockoutBannerSettingsUpdated'
    );
    expect(socket.disconnect.mock.calls.length).toBe(disconnectCallsBefore + 1);
  });

  it('uses latest callback refs without reconnecting', () => {
    const firstSystem = vi.fn();
    const secondSystem = vi.fn();

    const { rerender } = render(
      <TestHarness onSystemBannerSettingsUpdated={firstSystem} />
    );

    const socket = getFakeSocket();
    const onCallCountBefore = socket.on.mock.calls.length;

    rerender(<TestHarness onSystemBannerSettingsUpdated={secondSystem} />);

    socket.emitEvent('systemBannerSettingsUpdated');

    expect(firstSystem).not.toHaveBeenCalled();
    expect(secondSystem).toHaveBeenCalledTimes(1);
    expect(socket.on).toHaveBeenCalledTimes(onCallCountBefore);
  });
});
