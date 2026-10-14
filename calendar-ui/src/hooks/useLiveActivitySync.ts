import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

import {
  CALENDAR_SOCKET_IO_OPTIONS,
  getCalendarSocketUrl,
} from '@/lib/calendar-socket';
import {
  applyActivityListEditLockFromSocket,
  parseActivityLockChangedPayload,
  scheduleLiveActivityRefresh,
} from '@/lib/liveActivitySync';

type ActivityTablePayload = { activityId: number };

/**
 * Socket.IO subscriber for Look Ahead shared room; debounces TanStack invalidate of
 * report data + activity lists. Returns connection state so activity list polling
 * can back off while live.
 *
 * Mount once via {@link LiveActivitySyncProvider}; consumers read
 * {@link useLiveActivitySyncContext} instead of calling this hook directly.
 */
export function useLiveActivitySync(): { isSocketConnected: boolean } {
  const queryClient = useQueryClient();
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    const socket = io(getCalendarSocketUrl(), CALENDAR_SOCKET_IO_OPTIONS);

    const subscribe = () => {
      socket.emit('subscribeToActivities');
    };

    const handleConnect = () => {
      subscribe();
      setIsSocketConnected(true);
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    function handleRemoteTableEvent(payload: unknown): void {
      let activityId: number | undefined;
      if (
        payload &&
        typeof payload === 'object' &&
        'activityId' in payload &&
        typeof (payload as ActivityTablePayload).activityId === 'number'
      ) {
        activityId = (payload as ActivityTablePayload).activityId;
      }
      scheduleLiveActivityRefresh(queryClient, {
        source: 'remote',
        activityId,
      });
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect', subscribe);

    function handleActivityLockChanged(payload: unknown): void {
      const lockPayload = parseActivityLockChangedPayload(payload);
      if (
        lockPayload &&
        applyActivityListEditLockFromSocket(queryClient, lockPayload)
      ) {
        return;
      }
      scheduleLiveActivityRefresh(queryClient, {
        source: 'remote',
        activityId:
          lockPayload?.activityId ??
          (payload &&
          typeof payload === 'object' &&
          'activityId' in payload &&
          typeof (payload as ActivityTablePayload).activityId === 'number'
            ? (payload as ActivityTablePayload).activityId
            : undefined),
      });
    }

    socket.on('activityCreated', handleRemoteTableEvent);
    socket.on('activityUpdated', handleRemoteTableEvent);
    socket.on('activityLockChanged', handleActivityLockChanged);

    return () => {
      socket.emit('unsubscribeFromActivities');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect', subscribe);
      socket.off('activityCreated', handleRemoteTableEvent);
      socket.off('activityUpdated', handleRemoteTableEvent);
      socket.off('activityLockChanged', handleActivityLockChanged);
      socket.disconnect();
      setIsSocketConnected(false);
    };
  }, [queryClient]);

  return { isSocketConnected };
}
