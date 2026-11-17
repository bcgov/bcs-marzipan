import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LIVE_SYNC_CONNECTION_OFFLINE_ALERT } from '@/lib/activity-edit-session-messages';

import { useLiveSyncConnectionAlert } from './useLiveSyncConnectionAlert';

describe('useLiveSyncConnectionAlert', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { onLine: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows live-sync offline copy when the browser goes offline', () => {
    const { result } = renderHook(() => useLiveSyncConnectionAlert());
    expect(result.current).toBeNull();

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current?.phase).toBe('browser-offline');
    expect(result.current?.message).toBe(LIVE_SYNC_CONNECTION_OFFLINE_ALERT);
  });
});
