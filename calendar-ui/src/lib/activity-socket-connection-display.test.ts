import { describe, expect, it } from 'vitest';

import {
  isActivitySocketConnectionBlocked,
  resolveActivitySocketConnectionDisplay,
} from './activity-socket-connection-display';

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

  it('returns browser-offline when the browser is offline', () => {
    expect(
      resolveActivitySocketConnectionDisplay({
        socketConnected: true,
        browserOnline: false,
        disconnectedLongEnough: false,
      })
    ).toBe('browser-offline');
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

  it('returns disconnected after a long disconnect while online', () => {
    expect(
      resolveActivitySocketConnectionDisplay({
        socketConnected: false,
        browserOnline: true,
        disconnectedLongEnough: true,
      })
    ).toBe('disconnected');
  });
});

describe('isActivitySocketConnectionBlocked', () => {
  it('is false only when connected', () => {
    expect(isActivitySocketConnectionBlocked('connected')).toBe(false);
    expect(isActivitySocketConnectionBlocked('reconnecting')).toBe(true);
    expect(isActivitySocketConnectionBlocked('browser-offline')).toBe(true);
    expect(isActivitySocketConnectionBlocked('disconnected')).toBe(true);
  });
});
