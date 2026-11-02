import { describe, expect, it } from 'vitest';

import { createMockActivityResponse } from '@corpcal/shared/test-utils';

import { resolveActivityEditResyncAction } from './activity-edit-resync';

const BASE_TOKEN = '2026-10-08T18:00:00.000Z';

function activityWithToken(token: string) {
  return createMockActivityResponse({
    id: 139,
    lastUpdatedDateTime: token,
  });
}

describe('resolveActivityEditResyncAction', () => {
  it.each([
    ['owned', 'continue-owned'],
    ['idle', 'reacquire'],
    ['locked-by-other', 'blocked-by-other'],
    ['unavailable', 'retry'],
  ] as const)(
    'returns %s lock state as %s when the activity is unchanged',
    (serverLockState, expected) => {
      expect(
        resolveActivityEditResyncAction({
          editSessionToken: BASE_TOKEN,
          latestActivity: activityWithToken(BASE_TOKEN),
          serverLockState,
        })
      ).toBe(expected);
    }
  );

  it('blocks reconciliation when the server activity changed', () => {
    expect(
      resolveActivityEditResyncAction({
        editSessionToken: BASE_TOKEN,
        latestActivity: activityWithToken('2026-10-08T18:01:00.000Z'),
        serverLockState: 'idle',
      })
    ).toBe('server-changed');
  });
});
