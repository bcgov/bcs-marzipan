import { io } from 'socket.io-client';
import { useEffect } from 'react';

import {
  CALENDAR_SOCKET_IO_OPTIONS,
  getCalendarSocketUrl,
} from '@/lib/calendar-socket';

interface UseLookAheadWebSocketOptions {
  onActivityUpdate?: () => void;
}

/**
 * Subscribes to activity table WebSocket events and invokes the callback when
 * any activity is created or updated, so Look Ahead (or other consumers) can
 * refetch.
 */
export function useLookAheadWebSocket({
  onActivityUpdate,
}: UseLookAheadWebSocketOptions = {}): void {
  useEffect(() => {
    const socket = io(getCalendarSocketUrl(), CALENDAR_SOCKET_IO_OPTIONS);

    const subscribe = () => {
      socket.emit('subscribeToActivities');
    };

    socket.on('connect', subscribe);
    socket.io.on('reconnect', subscribe);

    socket.on('activityCreated', () => {
      onActivityUpdate?.();
    });

    socket.on('activityUpdated', () => {
      onActivityUpdate?.();
    });

    return () => {
      socket.emit('unsubscribeFromActivities');
      socket.off('connect', subscribe);
      socket.io.off('reconnect', subscribe);
      socket.off('activityCreated');
      socket.off('activityUpdated');
      socket.disconnect();
    };
  }, [onActivityUpdate]);
}
