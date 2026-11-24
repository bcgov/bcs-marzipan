import { useEffect, useRef, useState } from 'react';

import {
  ACTIVITY_EDIT_CONNECTION_RESTORED_ALERT,
  getLiveSyncConnectionBlockedAlertMessage,
} from '@/lib/activity-edit-session-messages';

import {
  CONNECTION_RESTORED_ALERT_DURATION_MS,
  type ActivityConnectionAlertDisplay,
} from './useActivityEditConnectionUi';

/**
 * Browser online/offline alerts for read-only live data (Look Ahead, reports).
 * Does not subscribe to the activity socket — HTTP/refetch continues while offline.
 */
export function useLiveSyncConnectionAlert(): ActivityConnectionAlertDisplay | null {
  const [browserOnline, setBrowserOnline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine
  );
  const [connectionAlert, setConnectionAlert] =
    useState<ActivityConnectionAlertDisplay | null>(null);
  const userSawOfflineAlertRef = useRef(false);
  const hideRestoredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    const onOnline = () => setBrowserOnline(true);
    const onOffline = () => setBrowserOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (hideRestoredTimerRef.current != null) {
      clearTimeout(hideRestoredTimerRef.current);
      hideRestoredTimerRef.current = null;
    }

    if (!browserOnline) {
      userSawOfflineAlertRef.current = true;
      setConnectionAlert({
        phase: 'browser-offline',
        message: getLiveSyncConnectionBlockedAlertMessage('browser-offline'),
      });
      return;
    }

    if (userSawOfflineAlertRef.current) {
      userSawOfflineAlertRef.current = false;
      setConnectionAlert({
        phase: 'restored',
        message: ACTIVITY_EDIT_CONNECTION_RESTORED_ALERT,
      });
      hideRestoredTimerRef.current = setTimeout(() => {
        hideRestoredTimerRef.current = null;
        setConnectionAlert(null);
      }, CONNECTION_RESTORED_ALERT_DURATION_MS);
      return () => {
        if (hideRestoredTimerRef.current != null) {
          clearTimeout(hideRestoredTimerRef.current);
          hideRestoredTimerRef.current = null;
        }
      };
    }

    setConnectionAlert(null);
    return undefined;
  }, [browserOnline]);

  return connectionAlert;
}
