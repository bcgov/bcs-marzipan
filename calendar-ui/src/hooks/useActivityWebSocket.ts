import { io } from 'socket.io-client';
import { useEffect, useRef } from 'react';

import {
  CALENDAR_SOCKET_IO_OPTIONS,
  getCalendarSocketUrl,
} from '@/lib/calendar-socket';
import type { LockHandoffPendingPayload } from '@/lib/lock-handoff-toast';

export type LockHandoffPendingSocketPayload = LockHandoffPendingPayload;

interface UseActivityWebSocketOptions {
  onLockAcquired?: (lockedBy: { userId: number; username: string }) => void;
  onLockReleased?: () => void;
  onDataUpdated?: () => void;
  /** User-targeted: admin handoff grace countdown (same socket connection). */
  onLockHandoffPending?: (payload: LockHandoffPendingSocketPayload) => void;
  /** User-targeted: requester cancelled pending force handoff. */
  onLockHandoffCancelled?: () => void;
}

/**
 * Subscribes to WebSocket events for a specific activity. Notifies the caller
 * when the lock status changes or when another user saves changes, so the
 * page can show banners and refresh data without polling.
 */
export function useActivityWebSocket(
  activityId: number,
  options: UseActivityWebSocketOptions
): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const socket = io(getCalendarSocketUrl(), CALENDAR_SOCKET_IO_OPTIONS);

    const emitViewActivity = () => {
      socket.emit('viewActivity', activityId);
    };

    socket.on('connect', emitViewActivity);
    // `connect` usually fires after transport reconnect too; this is explicit for Manager retries.
    socket.io.on('reconnect', emitViewActivity);

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

    return () => {
      socket.emit('leaveActivity', activityId);
      socket.off('connect', emitViewActivity);
      socket.io.off('reconnect', emitViewActivity);
      socket.off('lockAcquired');
      socket.off('lockReleased');
      socket.off('dataUpdated');
      socket.off('lockHandoffPending');
      socket.off('lockHandoffCancelled');
      socket.disconnect();
    };
  }, [activityId]);
}
