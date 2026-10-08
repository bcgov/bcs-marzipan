import { describe, expect, it } from 'vitest';

import {
  ACTIVITY_CONFIRM_OFFLINE_BLOCKED_MESSAGE,
  ACTIVITY_CONFIRM_RECONNECTING_BLOCKED_MESSAGE,
  ACTIVITY_CONFIRM_RESYNCING_BLOCKED_MESSAGE,
  getActivityConfirmSubmitBlockedMessage,
  isActivityConfirmConnectionBlockedMessage,
} from './activity-confirm-submit-blocked-message';

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

  it('returns resyncing copy when the edit lock is being restored', () => {
    expect(
      getActivityConfirmSubmitBlockedMessage('connected', 'resyncing')
    ).toBe(ACTIVITY_CONFIRM_RESYNCING_BLOCKED_MESSAGE);
  });
});

describe('isActivityConfirmConnectionBlockedMessage', () => {
  it('returns true for offline and reconnecting copy', () => {
    expect(
      isActivityConfirmConnectionBlockedMessage(
        ACTIVITY_CONFIRM_OFFLINE_BLOCKED_MESSAGE
      )
    ).toBe(true);
    expect(
      isActivityConfirmConnectionBlockedMessage(
        ACTIVITY_CONFIRM_RECONNECTING_BLOCKED_MESSAGE
      )
    ).toBe(true);
  });

  it('returns false for edit recovery and empty messages', () => {
    expect(
      isActivityConfirmConnectionBlockedMessage(
        getActivityConfirmSubmitBlockedMessage('connected', 'server-changed')
      )
    ).toBe(false);
    expect(isActivityConfirmConnectionBlockedMessage(null)).toBe(false);
  });
});
