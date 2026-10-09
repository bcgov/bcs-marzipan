import { describe, expect, it } from 'vitest';

import {
  ACTIVITY_EDIT_CONNECTION_RECONNECTING_ALERT,
  ACTIVITY_EDIT_RESYNCING_MODAL_MESSAGE,
  connectionBlocksFieldInput,
  connectionBlocksFieldInputUnlessActiveSession,
  getActivityConfirmBlockedMessage,
  getActivityEditRecoveryBannerMessage,
  isActivityEditConnectionBlocked,
  isActivityEditSessionActionsBlocked,
  shouldShowActivityConnectionAlert,
  shouldSuppressAcquireConnectionToast,
} from './activity-edit-session-messages';

describe('getActivityConfirmBlockedMessage', () => {
  it('prioritizes socket connectivity over edit recovery', () => {
    expect(
      getActivityConfirmBlockedMessage('save', 'reconnecting', 'server-changed')
    ).toBe(ACTIVITY_EDIT_CONNECTION_RECONNECTING_ALERT);
  });

  it('returns action-specific offline copy', () => {
    expect(getActivityConfirmBlockedMessage('save', 'offline', null)).toMatch(
      /save changes/i
    );
    expect(getActivityConfirmBlockedMessage('review', 'offline', null)).toMatch(
      /review/i
    );
  });

  it('returns elsewhere copy when connected but server version changed', () => {
    expect(
      getActivityConfirmBlockedMessage('save', 'connected', 'server-changed')
    ).toMatch(/updated elsewhere/i);
  });

  it('returns resyncing copy when restoring session', () => {
    expect(
      getActivityConfirmBlockedMessage('save', 'connected', 'resyncing')
    ).toBe(ACTIVITY_EDIT_RESYNCING_MODAL_MESSAGE);
  });
});

describe('isActivityEditConnectionBlocked', () => {
  it('is true when offline or reconnecting', () => {
    expect(isActivityEditConnectionBlocked('offline')).toBe(true);
    expect(isActivityEditConnectionBlocked('reconnecting')).toBe(true);
    expect(isActivityEditConnectionBlocked('connected')).toBe(false);
  });
});

describe('connectionBlocksFieldInput', () => {
  it('matches isActivityEditConnectionBlocked', () => {
    expect(connectionBlocksFieldInput('offline')).toBe(true);
    expect(connectionBlocksFieldInput('connected')).toBe(false);
  });
});

describe('connectionBlocksFieldInputUnlessActiveSession', () => {
  it('blocks when disconnected and session has not started', () => {
    expect(
      connectionBlocksFieldInputUnlessActiveSession('offline', false)
    ).toBe(true);
    expect(
      connectionBlocksFieldInputUnlessActiveSession('reconnecting', false)
    ).toBe(true);
  });

  it('allows field input when disconnected but session is active', () => {
    expect(connectionBlocksFieldInputUnlessActiveSession('offline', true)).toBe(
      false
    );
  });

  it('does not block when connected', () => {
    expect(
      connectionBlocksFieldInputUnlessActiveSession('connected', false)
    ).toBe(false);
  });
});

describe('shouldShowActivityConnectionAlert', () => {
  const base = {
    mayEditFormFields: true,
    socketConnection: 'offline' as const,
    isLockedByOther: false,
    isBlockedByRecurringLockout: false,
  };

  it('shows when user may edit and socket is not connected', () => {
    expect(shouldShowActivityConnectionAlert(base)).toBe(true);
    expect(
      shouldShowActivityConnectionAlert({
        ...base,
        socketConnection: 'connected',
      })
    ).toBe(false);
  });

  it('hides when locked by other or lockout', () => {
    expect(
      shouldShowActivityConnectionAlert({ ...base, isLockedByOther: true })
    ).toBe(false);
    expect(
      shouldShowActivityConnectionAlert({
        ...base,
        isBlockedByRecurringLockout: true,
      })
    ).toBe(false);
  });

  it('hides when user cannot edit form fields', () => {
    expect(
      shouldShowActivityConnectionAlert({ ...base, mayEditFormFields: false })
    ).toBe(false);
  });
});

describe('shouldSuppressAcquireConnectionToast', () => {
  it('suppresses network failures while connection is blocked', () => {
    expect(shouldSuppressAcquireConnectionToast('network', 'offline')).toBe(
      true
    );
    expect(
      shouldSuppressAcquireConnectionToast('network', 'reconnecting')
    ).toBe(true);
    expect(shouldSuppressAcquireConnectionToast('network', 'connected')).toBe(
      false
    );
  });

  it('does not suppress other failure reasons', () => {
    expect(
      shouldSuppressAcquireConnectionToast('locked-by-other', 'offline')
    ).toBe(false);
  });
});

describe('isActivityEditSessionActionsBlocked', () => {
  it('matches save blocked state', () => {
    expect(isActivityEditSessionActionsBlocked('offline', null)).toBe(true);
    expect(isActivityEditSessionActionsBlocked('connected', null)).toBe(false);
  });
});

describe('getActivityEditRecoveryBannerMessage', () => {
  it('shows banner for server-changed and failed recovery only', () => {
    expect(getActivityEditRecoveryBannerMessage('server-changed')).toMatch(
      /updated elsewhere/i
    );
    expect(getActivityEditRecoveryBannerMessage('retry')).toMatch(
      /could not be restored/i
    );
    expect(getActivityEditRecoveryBannerMessage('resyncing')).toBeNull();
    expect(getActivityEditRecoveryBannerMessage(null)).toBeNull();
  });
});
