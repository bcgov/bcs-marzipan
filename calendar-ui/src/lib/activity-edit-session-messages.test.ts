import { describe, expect, it } from 'vitest';

import {
  ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT,
  ACTIVITY_EDIT_CONNECTION_OFFLINE_ALERT,
  ACTIVITY_EDIT_CONNECTION_OFFLINE_ALERT_BEFORE_EDIT,
  ACTIVITY_EDIT_CONNECTION_RECONNECTING_ALERT,
  ACTIVITY_EDIT_CONNECTION_VERIFYING_ALERT,
  ACTIVITY_EDIT_RESYNCING_MODAL_MESSAGE,
  connectionBlocksFieldInput,
  connectionBlocksFieldInputUnlessActiveSession,
  getActivityConfirmBlockedMessage,
  getActivityConfirmBlockedNotice,
  getActivityConnectionBlockedAlertMessage,
  getActivityConnectionDisconnectedAlertMessage,
  getActivityConnectionOfflineAlertMessage,
  getActivityEditAcquireFailureToastVariant,
  getActivityEditRecoveryBannerMessage,
  getActivitySubmitBlockedToastTitle,
  isActivityEditSessionActionsBlocked,
  isEditSessionConfirmGateClosed,
  shouldShowActivityConnectionAlert,
  shouldSuppressAcquireConnectionToast,
  shouldWarnActivityEditBeforeUnload,
  type ActivityEditConfirmAction,
  type ActivityEditRecoveryState,
} from './activity-edit-session-messages';
import {
  isActivitySocketConnectionBlocked,
  type ActivitySocketConnectionDisplay,
} from './activity-socket-connection-display';

describe('getActivityConnectionOfflineAlertMessage', () => {
  it('uses make-changes copy before an edit session starts', () => {
    expect(getActivityConnectionOfflineAlertMessage(false)).toBe(
      ACTIVITY_EDIT_CONNECTION_OFFLINE_ALERT_BEFORE_EDIT
    );
  });

  it('uses save-changes copy during an active edit session', () => {
    expect(getActivityConnectionOfflineAlertMessage(true)).toBe(
      ACTIVITY_EDIT_CONNECTION_OFFLINE_ALERT
    );
  });
});

describe('getActivityConnectionDisconnectedAlertMessage', () => {
  it('returns the same copy before and during an edit session', () => {
    expect(getActivityConnectionDisconnectedAlertMessage(false)).toBe(
      ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT
    );
    expect(getActivityConnectionDisconnectedAlertMessage(true)).toBe(
      ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT
    );
  });
});

describe('getActivityConnectionBlockedAlertMessage', () => {
  it('maps socket display states to alert copy', () => {
    expect(
      getActivityConnectionBlockedAlertMessage('browser-offline', true)
    ).toBe(ACTIVITY_EDIT_CONNECTION_OFFLINE_ALERT);
    expect(
      getActivityConnectionBlockedAlertMessage('disconnected', false)
    ).toBe(ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT);
    expect(
      getActivityConnectionBlockedAlertMessage('reconnecting', false)
    ).toBe(ACTIVITY_EDIT_CONNECTION_RECONNECTING_ALERT);
  });
});

describe('getActivityConfirmBlockedMessage', () => {
  it('prioritizes socket connectivity over edit recovery', () => {
    expect(
      getActivityConfirmBlockedMessage('save', 'reconnecting', 'server-changed')
    ).toBe(ACTIVITY_EDIT_CONNECTION_RECONNECTING_ALERT);
  });

  it('returns action-specific offline copy', () => {
    expect(
      getActivityConfirmBlockedMessage('save', 'browser-offline', null)
    ).toMatch(/save changes/i);
    expect(
      getActivityConfirmBlockedMessage('review', 'browser-offline', null)
    ).toMatch(/review/i);
  });

  it('returns disconnected copy for confirm actions', () => {
    expect(getActivityConfirmBlockedMessage('save', 'disconnected', null)).toBe(
      ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT
    );
    expect(
      getActivityConfirmBlockedMessage('clone', 'disconnected', null)
    ).toBe(ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT);
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

describe('getActivityConfirmBlockedNotice', () => {
  it('returns connection variant for offline and reconnecting', () => {
    expect(
      getActivityConfirmBlockedNotice('save', 'browser-offline', null)
    ).toEqual({
      variant: 'connection',
      message: expect.stringMatching(/offline/i),
    });
    expect(
      getActivityConfirmBlockedNotice('save', 'disconnected', null)
    ).toEqual({
      variant: 'connection',
      message: expect.stringMatching(/connection lost/i),
    });
    expect(
      getActivityConfirmBlockedNotice('delete', 'reconnecting', null)
    ).toEqual({
      variant: 'connection',
      message: ACTIVITY_EDIT_CONNECTION_RECONNECTING_ALERT,
    });
  });

  it('returns recovery variant when connected but resyncing', () => {
    expect(
      getActivityConfirmBlockedNotice('save', 'connected', 'resyncing')
    ).toEqual({
      variant: 'recovery',
      message: ACTIVITY_EDIT_RESYNCING_MODAL_MESSAGE,
    });
  });
});

describe('isActivitySocketConnectionBlocked', () => {
  it('is true when offline, disconnected, or reconnecting', () => {
    expect(isActivitySocketConnectionBlocked('browser-offline')).toBe(true);
    expect(isActivitySocketConnectionBlocked('disconnected')).toBe(true);
    expect(isActivitySocketConnectionBlocked('reconnecting')).toBe(true);
    expect(isActivitySocketConnectionBlocked('connected')).toBe(false);
  });
});

describe('connectionBlocksFieldInput', () => {
  it('matches isActivitySocketConnectionBlocked', () => {
    expect(connectionBlocksFieldInput('disconnected')).toBe(true);
    expect(connectionBlocksFieldInput('connected')).toBe(false);
  });
});

describe('connectionBlocksFieldInputUnlessActiveSession', () => {
  it('blocks when disconnected and session has not started', () => {
    expect(
      connectionBlocksFieldInputUnlessActiveSession('browser-offline', false)
    ).toBe(true);
    expect(
      connectionBlocksFieldInputUnlessActiveSession('reconnecting', false)
    ).toBe(true);
  });

  it('allows field input when disconnected but session is active', () => {
    expect(
      connectionBlocksFieldInputUnlessActiveSession('disconnected', true)
    ).toBe(false);
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
    socketConnection: 'browser-offline' as const,
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
    expect(
      shouldSuppressAcquireConnectionToast('network', 'browser-offline')
    ).toBe(true);
    expect(
      shouldSuppressAcquireConnectionToast('network', 'reconnecting')
    ).toBe(true);
    expect(shouldSuppressAcquireConnectionToast('network', 'connected')).toBe(
      false
    );
  });

  it('does not suppress other failure reasons', () => {
    expect(
      shouldSuppressAcquireConnectionToast('locked-by-other', 'disconnected')
    ).toBe(false);
  });
});

const ALL_CONFIRM_ACTIONS: ActivityEditConfirmAction[] = [
  'save',
  'review',
  'complete',
  'delete',
  'request-delete',
  'clone',
  'note',
];

describe('isEditSessionConfirmGateClosed', () => {
  it('is closed when socket is blocked or recovery is active', () => {
    expect(isEditSessionConfirmGateClosed('disconnected', null)).toBe(true);
    expect(isEditSessionConfirmGateClosed('reconnecting', null)).toBe(true);
    expect(isEditSessionConfirmGateClosed('connected', 'resyncing')).toBe(true);
    expect(isEditSessionConfirmGateClosed('connected', null)).toBe(false);
  });
});

describe('isActivityEditSessionActionsBlocked', () => {
  it('matches save blocked state', () => {
    expect(isActivityEditSessionActionsBlocked('disconnected', null)).toBe(
      true
    );
    expect(isActivityEditSessionActionsBlocked('connected', null)).toBe(false);
  });

  it('matches every confirm action blocked state', () => {
    const cases: Array<
      [ActivitySocketConnectionDisplay, ActivityEditRecoveryState]
    > = [
      ['connected', null],
      ['disconnected', null],
      ['browser-offline', null],
      ['reconnecting', null],
      ['connected', 'resyncing'],
      ['connected', 'server-changed'],
      ['connected', 'retry'],
    ];

    for (const [socket, recovery] of cases) {
      const gate = isActivityEditSessionActionsBlocked(socket, recovery);
      for (const action of ALL_CONFIRM_ACTIONS) {
        const actionBlocked =
          getActivityConfirmBlockedMessage(action, socket, recovery) != null;
        expect(actionBlocked).toBe(gate);
      }
    }
  });
});

describe('shouldWarnActivityEditBeforeUnload', () => {
  const savableSession = {
    isDirty: true,
    isActiveEditSession: true,
    socketConnection: 'connected' as const,
    editRecoveryState: null,
  };

  it('warns when dirty edits can still be saved', () => {
    expect(shouldWarnActivityEditBeforeUnload(savableSession)).toBe(true);
  });

  it('warns for dirty edits after the edit lock expires while idle', () => {
    expect(
      shouldWarnActivityEditBeforeUnload({
        ...savableSession,
        isActiveEditSession: false,
        socketConnection: 'disconnected',
        editRecoveryState: 'idle-expired',
      })
    ).toBe(true);
  });

  it('does not warn for a clean idle-expired session', () => {
    expect(
      shouldWarnActivityEditBeforeUnload({
        ...savableSession,
        isDirty: false,
        isActiveEditSession: false,
        socketConnection: 'disconnected',
        editRecoveryState: 'idle-expired',
      })
    ).toBe(false);
  });

  it('does not warn when clean, inactive, disconnected, or save blocked', () => {
    expect(
      shouldWarnActivityEditBeforeUnload({ ...savableSession, isDirty: false })
    ).toBe(false);
    expect(
      shouldWarnActivityEditBeforeUnload({
        ...savableSession,
        isActiveEditSession: false,
      })
    ).toBe(false);
    expect(
      shouldWarnActivityEditBeforeUnload({
        ...savableSession,
        socketConnection: 'browser-offline',
      })
    ).toBe(false);
    expect(
      shouldWarnActivityEditBeforeUnload({
        ...savableSession,
        editRecoveryState: 'server-changed',
      })
    ).toBe(false);
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

describe('getActivityEditAcquireFailureToastVariant', () => {
  it('returns warning for lock contention, network, and time lockout', () => {
    expect(getActivityEditAcquireFailureToastVariant('locked-by-other')).toBe(
      'warning'
    );
    expect(getActivityEditAcquireFailureToastVariant('network')).toBe(
      'warning'
    );
    expect(getActivityEditAcquireFailureToastVariant('time-lockout')).toBe(
      'warning'
    );
  });

  it('returns error for auth and request failures', () => {
    expect(getActivityEditAcquireFailureToastVariant('unauthorized')).toBe(
      'error'
    );
    expect(getActivityEditAcquireFailureToastVariant('request-failed')).toBe(
      'error'
    );
  });

  it('returns null when no toast should show', () => {
    expect(getActivityEditAcquireFailureToastVariant(null)).toBeNull();
  });
});

describe('getActivitySubmitBlockedToastTitle', () => {
  it('returns action-specific titles', () => {
    expect(getActivitySubmitBlockedToastTitle('save')).toBe('Unable to save');
    expect(getActivitySubmitBlockedToastTitle('review')).toBe(
      'Unable to review'
    );
    expect(getActivitySubmitBlockedToastTitle('complete')).toBe(
      'Unable to complete'
    );
  });
});

describe('connection verifying alert copy', () => {
  it('matches resyncing modal message', () => {
    expect(ACTIVITY_EDIT_CONNECTION_VERIFYING_ALERT).toBe(
      ACTIVITY_EDIT_RESYNCING_MODAL_MESSAGE
    );
  });
});
