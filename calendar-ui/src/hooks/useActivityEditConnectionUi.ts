import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ACTIVITY_EDIT_CONNECTION_RESTORED_ALERT,
  ACTIVITY_EDIT_CONNECTION_VERIFYING_ALERT,
  getActivityConnectionBlockedAlertMessage,
  type ActivityEditRecoveryState,
} from '../lib/activity-edit-session-messages';
import {
  isActivitySocketConnectionBlocked,
  type ActivitySocketConnectionDisplay,
} from '../lib/activity-socket-connection-display';

/** How long the top-of-screen "connection restored" alert stays visible. */
export const CONNECTION_RESTORED_ALERT_DURATION_MS = 1_500;

export type ActivityConnectionAlertPhase =
  | 'browser-offline'
  | 'disconnected'
  | 'reconnecting'
  | 'verifying'
  | 'restored';

export type ActivityConnectionAlertDisplay = {
  phase: ActivityConnectionAlertPhase;
  message: string;
};

export type ActivityEditResyncOutcome = 'success' | 'failure';

type BlockedSocketConnectionPhase = Exclude<
  ActivityConnectionAlertPhase,
  'verifying' | 'restored'
>;

export type UseActivityEditConnectionUiInput = {
  activityId: number;
  socketConnection: ActivitySocketConnectionDisplay;
  connectionAlertEligible: boolean;
  isActiveEditSession: boolean;
  editRecoveryState: ActivityEditRecoveryState;
};

type UseActivityEditConnectionUiResult = {
  connectionAlert: ActivityConnectionAlertDisplay | null;
  notifyResyncOutcome: (outcome: ActivityEditResyncOutcome) => void;
};

function connectionAlertPhase(
  socketConnection: ActivitySocketConnectionDisplay
): BlockedSocketConnectionPhase | null {
  switch (socketConnection) {
    case 'browser-offline':
      return 'browser-offline';
    case 'disconnected':
      return 'disconnected';
    case 'reconnecting':
      return 'reconnecting';
    default:
      return null;
  }
}

/**
 * Top-of-screen alerts skip the brief `reconnecting` grace window (initial
 * handshake and post-drop blips). Escalation to `disconnected` still alerts.
 */
function shouldNotifyBlockedConnection(
  blockedPhase: BlockedSocketConnectionPhase,
  hasEstablishedConnection: boolean
): boolean {
  if (blockedPhase === 'reconnecting') {
    return false;
  }
  if (hasEstablishedConnection) {
    return true;
  }
  return blockedPhase === 'disconnected' || blockedPhase === 'browser-offline';
}

export function useActivityEditConnectionUi({
  activityId,
  socketConnection,
  connectionAlertEligible,
  isActiveEditSession,
  editRecoveryState,
}: UseActivityEditConnectionUiInput): UseActivityEditConnectionUiResult {
  const [connectionAlert, setConnectionAlert] =
    useState<ActivityConnectionAlertDisplay | null>(null);
  const userWasNotifiedRef = useRef(false);
  const awaitingResyncSuccessRef = useRef(false);
  const hasEstablishedConnectionRef = useRef(false);
  const hideRestoredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const prevSocketRef = useRef(socketConnection);
  const prevEditRecoveryRef = useRef(editRecoveryState);

  const clearRestoredTimer = useCallback(() => {
    if (hideRestoredTimerRef.current != null) {
      clearTimeout(hideRestoredTimerRef.current);
      hideRestoredTimerRef.current = null;
    }
  }, []);

  const resetConnectionFeedbackState = useCallback(() => {
    clearRestoredTimer();
    userWasNotifiedRef.current = false;
    awaitingResyncSuccessRef.current = false;
    hasEstablishedConnectionRef.current = false;
    setConnectionAlert(null);
  }, [clearRestoredTimer]);

  useEffect(() => {
    resetConnectionFeedbackState();
  }, [activityId, resetConnectionFeedbackState]);

  useEffect(() => {
    return () => {
      clearRestoredTimer();
    };
  }, [clearRestoredTimer]);

  const showRestored = useCallback(() => {
    clearRestoredTimer();
    userWasNotifiedRef.current = false;
    awaitingResyncSuccessRef.current = false;
    setConnectionAlert({
      phase: 'restored',
      message: ACTIVITY_EDIT_CONNECTION_RESTORED_ALERT,
    });
    hideRestoredTimerRef.current = setTimeout(() => {
      hideRestoredTimerRef.current = null;
      setConnectionAlert(null);
    }, CONNECTION_RESTORED_ALERT_DURATION_MS);
  }, [clearRestoredTimer]);

  /**
   * "Connection restored" after resync: prefer clearing `editRecoveryState` from
   * resyncing (see effect below). `notifyResyncOutcome('success')` is a fallback
   * when resync completes without that rerender (e.g. tests / same-tick completion).
   */
  const notifyResyncSuccess = useCallback(() => {
    if (!userWasNotifiedRef.current && !awaitingResyncSuccessRef.current) {
      return;
    }
    showRestored();
  }, [showRestored]);

  const notifyResyncFailure = useCallback(() => {
    clearRestoredTimer();
    userWasNotifiedRef.current = false;
    awaitingResyncSuccessRef.current = false;
    setConnectionAlert(null);
  }, [clearRestoredTimer]);

  const notifyResyncOutcome = useCallback(
    (outcome: ActivityEditResyncOutcome) => {
      if (outcome === 'success') {
        notifyResyncSuccess();
      } else {
        notifyResyncFailure();
      }
    },
    [notifyResyncFailure, notifyResyncSuccess]
  );

  useEffect(() => {
    const prevSocket = prevSocketRef.current;
    prevSocketRef.current = socketConnection;
    const prevEditRecovery = prevEditRecoveryRef.current;
    prevEditRecoveryRef.current = editRecoveryState;

    if (socketConnection === 'connected') {
      hasEstablishedConnectionRef.current = true;
    }

    const blockedPhase = connectionAlertPhase(socketConnection);

    if (!connectionAlertEligible && blockedPhase != null) {
      clearRestoredTimer();
      userWasNotifiedRef.current = false;
      awaitingResyncSuccessRef.current = false;
      setConnectionAlert(null);
      return;
    }

    if (
      connectionAlertEligible &&
      blockedPhase === 'reconnecting' &&
      userWasNotifiedRef.current
    ) {
      clearRestoredTimer();
      awaitingResyncSuccessRef.current = false;
      setConnectionAlert(null);
      return;
    }

    if (
      connectionAlertEligible &&
      blockedPhase != null &&
      shouldNotifyBlockedConnection(
        blockedPhase,
        hasEstablishedConnectionRef.current
      )
    ) {
      userWasNotifiedRef.current = true;
      awaitingResyncSuccessRef.current = false;
      clearRestoredTimer();
      setConnectionAlert({
        phase: blockedPhase,
        message: getActivityConnectionBlockedAlertMessage(
          blockedPhase,
          isActiveEditSession
        ),
      });
      return;
    }

    if (
      socketConnection === 'connected' &&
      isActivitySocketConnectionBlocked(prevSocket) &&
      userWasNotifiedRef.current
    ) {
      if (isActiveEditSession) {
        awaitingResyncSuccessRef.current = true;
        setConnectionAlert({
          phase: 'verifying',
          message: ACTIVITY_EDIT_CONNECTION_VERIFYING_ALERT,
        });
      } else {
        showRestored();
      }
      return;
    }

    if (
      socketConnection === 'connected' &&
      awaitingResyncSuccessRef.current &&
      editRecoveryState === 'resyncing'
    ) {
      setConnectionAlert({
        phase: 'verifying',
        message: ACTIVITY_EDIT_CONNECTION_VERIFYING_ALERT,
      });
      return;
    }

    if (
      socketConnection === 'connected' &&
      awaitingResyncSuccessRef.current &&
      prevEditRecovery === 'resyncing' &&
      editRecoveryState !== 'resyncing'
    ) {
      if (editRecoveryState == null) {
        showRestored();
      } else {
        clearRestoredTimer();
        userWasNotifiedRef.current = false;
        awaitingResyncSuccessRef.current = false;
        setConnectionAlert(null);
      }
    }
  }, [
    activityId,
    clearRestoredTimer,
    connectionAlertEligible,
    editRecoveryState,
    isActiveEditSession,
    showRestored,
    socketConnection,
  ]);

  return {
    connectionAlert,
    notifyResyncOutcome,
  };
}
