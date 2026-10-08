import { io } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';

import {
  CALENDAR_SOCKET_IO_OPTIONS,
  getCalendarSocketUrl,
} from '@/lib/calendar-socket';
import type {
  LockHandoffPendingPayload,
  LockHandoffResolvedPayload,
} from '@/lib/lock-handoff-toast';

import {
  ACTIVITY_SOCKET_OFFLINE_AFTER_MS,
  resolveActivitySocketConnectionDisplay,
  type ActivitySocketConnectionDisplay,
} from './activity-socket-connection-display';

export type LockHandoffPendingSocketPayload = LockHandoffPendingPayload;
export type LockHandoffResolvedSocketPayload = LockHandoffResolvedPayload;

export type { ActivitySocketConnectionDisplay };

interface UseActivityWebSocketOptions {
  onLockAcquired?: (lockedBy: { userId: number; username: string }) => void;
  onLockReleased?: () => void;
  /** After transport reconnect — resync lock state (server may have released during outage). */
  onActivitySocketReconnect?: () => void;
  onDataUpdated?: () => void;
  /** User-targeted: admin handoff grace countdown (same socket connection). */
  onLockHandoffPending?: (payload: LockHandoffPendingSocketPayload) => void;
  /** User-targeted: requester cancelled pending force handoff. */
  onLockHandoffCancelled?: () => void;
  /** User-targeted: terminal handoff outcome (completed, cancelled, or aborted). */
  onLockHandoffResolved?: (payload: LockHandoffResolvedSocketPayload) => void;
}

/**
 * Subscribes to WebSocket events for a specific activity. Notifies the caller
 * when the lock status changes or when another user saves changes, so the
 * page can show banners and refresh data without polling.
 */
export function useActivityWebSocket(
  activityId: number,
  options: UseActivityWebSocketOptions
): ActivitySocketConnectionDisplay {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [connectionDisplay, setConnectionDisplay] =
    useState<ActivitySocketConnectionDisplay>('reconnecting');

  useEffect(() => {
    const socket = io(getCalendarSocketUrl(), CALENDAR_SOCKET_IO_OPTIONS);
    let offlineTimer: ReturnType<typeof setTimeout> | undefined;
    let disconnectedLongEnough = false;
    let socketConnected = socket.connected;
    let browserOnline = navigator.onLine;

    const syncDisplay = () => {
      setConnectionDisplay(
        resolveActivitySocketConnectionDisplay({
          socketConnected,
          browserOnline,
          disconnectedLongEnough,
        })
      );
    };

    const clearOfflineTimer = () => {
      if (offlineTimer != null) {
        clearTimeout(offlineTimer);
        offlineTimer = undefined;
      }
      disconnectedLongEnough = false;
    };

    const scheduleOfflineEscalation = () => {
      clearOfflineTimer();
      if (socketConnected) return;
      offlineTimer = setTimeout(() => {
        disconnectedLongEnough = true;
        syncDisplay();
      }, ACTIVITY_SOCKET_OFFLINE_AFTER_MS);
    };

    const markDisconnected = () => {
      socketConnected = false;
      syncDisplay();
      scheduleOfflineEscalation();
    };

    const markConnected = () => {
      socketConnected = true;
      clearOfflineTimer();
      syncDisplay();
    };

    const emitViewActivity = () => {
      socket.emit('viewActivity', activityId);
    };

    const onConnect = () => {
      markConnected();
      emitViewActivity();
    };
    const onManagerReconnect = () => {
      emitViewActivity();
      optionsRef.current.onActivitySocketReconnect?.();
    };

    const onBrowserOnline = () => {
      browserOnline = true;
      syncDisplay();
      if (!socketConnected) {
        scheduleOfflineEscalation();
      }
    };

    const onBrowserOffline = () => {
      browserOnline = false;
      clearOfflineTimer();
      syncDisplay();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', markDisconnected);
    socket.io.on('reconnect_attempt', markDisconnected);
    socket.io.on('reconnect', onManagerReconnect);

    socket.on(
      'lockAcquired',
      (data: {
        activityId: number;
        lockedBy: { userId: number; username: string };
      }) => {
        if (data.activityId === activityId) {
          optionsRef.current.onLockAcquired?.(data.lockedBy);
        }
      }
    );

    socket.on('lockReleased', (data: { activityId: number }) => {
      if (data.activityId === activityId) {
        optionsRef.current.onLockReleased?.();
      }
    });

    socket.on('dataUpdated', (data: { activityId: number }) => {
      if (data.activityId === activityId) {
        optionsRef.current.onDataUpdated?.();
      }
    });

    socket.on('lockHandoffPending', (data: LockHandoffPendingSocketPayload) => {
      if (data.activityId === activityId) {
        optionsRef.current.onLockHandoffPending?.(data);
      }
    });

    socket.on('lockHandoffCancelled', (data: { activityId: number }) => {
      if (data.activityId === activityId) {
        optionsRef.current.onLockHandoffCancelled?.();
      }
    });

    socket.on('lockHandoffResolved', (data: LockHandoffResolvedPayload) => {
      if (data.activityId === activityId) {
        optionsRef.current.onLockHandoffResolved?.(data);
      }
    });

    window.addEventListener('online', onBrowserOnline);
    window.addEventListener('offline', onBrowserOffline);

    if (socketConnected) {
      markConnected();
    } else {
      markDisconnected();
    }

    return () => {
      clearOfflineTimer();
      window.removeEventListener('online', onBrowserOnline);
      window.removeEventListener('offline', onBrowserOffline);
      socket.emit('leaveActivity', activityId);
      socket.off('connect', onConnect);
      socket.off('disconnect', markDisconnected);
      socket.io.off('reconnect_attempt', markDisconnected);
      socket.io.off('reconnect', onManagerReconnect);
      socket.off('lockAcquired');
      socket.off('lockReleased');
      socket.off('dataUpdated');
      socket.off('lockHandoffPending');
      socket.off('lockHandoffCancelled');
      socket.off('lockHandoffResolved');
      socket.disconnect();
    };
  }, [activityId]);

  return connectionDisplay;
}
