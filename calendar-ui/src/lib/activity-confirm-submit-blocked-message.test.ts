import { describe, expect, it } from 'vitest';

import { getActivityConfirmSubmitBlockedMessage } from './activity-confirm-submit-blocked-message';

describe('getActivityConfirmSubmitBlockedMessage', () => {
  it('prioritizes socket connectivity over edit recovery', () => {
    expect(
      getActivityConfirmSubmitBlockedMessage('reconnecting', 'server-changed')
    ).toMatch(/Reconnecting to the server/i);
  });

  it('returns offline copy when the browser is offline', () => {
    expect(getActivityConfirmSubmitBlockedMessage('offline', null)).toMatch(
      /offline/i
    );
  });

  it('returns edit recovery copy when connected but recovery is blocked', () => {
    expect(
      getActivityConfirmSubmitBlockedMessage('connected', 'server-changed')
    ).toMatch(/changed on the server/i);
  });
});
