import { afterEach, describe, expect, it, vi } from 'vitest';

import { releaseLockWithKeepalive } from './locksApi';

describe('releaseLockWithKeepalive', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('calls fetch with DELETE, keepalive, credentials, and X-Correlation-ID', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const uuid = '00000000-0000-4000-8000-0000000000aa';
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(uuid);

    releaseLockWithKeepalive(42);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/locks\/42$/),
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
        keepalive: true,
        headers: { 'X-Correlation-ID': uuid },
      })
    );
  });
});
