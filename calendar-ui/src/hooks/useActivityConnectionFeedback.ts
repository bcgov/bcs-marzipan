import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ACTIVITY_EDIT_CONNECTION_VERIFYING_ALERT,
  getActivityConnectionBlockedAlertMessage,
  getActivityConnectionRestoredAlertMessage,
  type ActivityEditRecoveryState,
} from '../lib/activity-edit-session-messages';
import {
  isActivitySocketConnectionBlocked,
  type ActivitySocketConnectionDisplay,
} from './activity-socket-connection-display';

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

type UseActivityConnectionFeedbackInput = {
  activityId: number;
  socketConnection: ActivitySocketConnectionDisplay;
  connectionAlertEligible: boolean;
  isActiveEditSession: boolean;
  editRecoveryState: ActivityEditRecoveryState;
};

type UseActivityConnectionFeedbackResult = {
  connectionAlert: ActivityConnectionAlertDisplay | null;
  reportResyncSuccess: () => void;
  reportResyncFailure: () => void;
};

function connectionAlertPhase(
  socketConnection: ActivitySocketConnectionDisplay
): ActivityConnectionAlertPhase | null {
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

export function useActivityConnectionFeedback({
  activityId,
  socketConnection,
  connectionAlertEligible,
  isActiveEditSession,
  editRecoveryState,
}: UseActivityConnectionFeedbackInput): UseActivityConnectionFeedbackResult {
  const [connectionAlert, setConnectionAlert] =
    useState<ActivityConnectionAlertDisplay | null>(null);
  const userWasNotifiedRef = useRef(false);
  const awaitingResyncSuccessRef = useRef(false);
  const hideRestoredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const prevSocketRef = useRef(socketConnection);

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
      message: getActivityConnectionRestoredAlertMessage(isActiveEditSession),
    });
    hideRestoredTimerRef.current = setTimeout(() => {
      hideRestoredTimerRef.current = null;
      setConnectionAlert(null);
    }, CONNECTION_RESTORED_ALERT_DURATION_MS);
  }, [clearRestoredTimer, isActiveEditSession]);

  const reportResyncSuccess = useCallback(() => {
    if (!userWasNotifiedRef.current && !awaitingResyncSuccessRef.current) {
      return;
    }
    showRestored();
  }, [showRestored]);

  const reportResyncFailure = useCallback(() => {
    clearRestoredTimer();
    userWasNotifiedRef.current = false;
    awaitingResyncSuccessRef.current = false;
    setConnectionAlert(null);
  }, [clearRestoredTimer]);

  useEffect(() => {
    const prevSocket = prevSocketRef.current;
    prevSocketRef.current = socketConnection;

    const blockedPhase = connectionAlertPhase(socketConnection);
    if (connectionAlertEligible && blockedPhase != null) {
      userWasNotifiedRef.current = true;
      awaitingResyncSuccessRef.current = false;
      clearRestoredTimer();
      setConnectionAlert({
        phase: blockedPhase,
        message: getActivityConnectionBlockedAlertMessage(
          socketConnection,
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
    reportResyncSuccess,
    reportResyncFailure,
  };
}
