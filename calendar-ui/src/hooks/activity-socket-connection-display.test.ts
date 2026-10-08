import { describe, expect, it } from 'vitest';

import { resolveActivitySocketConnectionDisplay } from './activity-socket-connection-display';

describe('resolveActivitySocketConnectionDisplay', () => {
  it('returns connected when the socket is open', () => {
    expect(
      resolveActivitySocketConnectionDisplay({
        socketConnected: true,
        browserOnline: true,
        disconnectedLongEnough: true,
      })
    ).toBe('connected');
  });

  it('returns offline when the browser is offline', () => {
    expect(
      resolveActivitySocketConnectionDisplay({
        socketConnected: false,
        browserOnline: false,
        disconnectedLongEnough: false,
      })
    ).toBe('offline');
  });

  it('returns reconnecting for a short disconnect while online', () => {
    expect(
      resolveActivitySocketConnectionDisplay({
        socketConnected: false,
        browserOnline: true,
        disconnectedLongEnough: false,
      })
    ).toBe('reconnecting');
  });

  it('returns offline after a long disconnect while online', () => {
    expect(
      resolveActivitySocketConnectionDisplay({
        socketConnected: false,
        browserOnline: true,
        disconnectedLongEnough: true,
      })
    ).toBe('offline');
  });
});
