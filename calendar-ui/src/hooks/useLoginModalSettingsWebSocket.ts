import { io } from 'socket.io-client';
import { useEffect, useRef } from 'react';

import {
  CALENDAR_SOCKET_IO_OPTIONS,
  getCalendarSocketUrl,
} from '@/lib/calendar-socket';

interface UseLoginModalSettingsWebSocketOptions {
  onSettingsUpdated?: () => void;
}

/**
 * Subscribes to the `loginModalSettingsUpdated` WebSocket event so that any
 * admin viewing the Login Modal settings panel picks up changes saved by
 * another admin without needing to refresh.
 *
 * The callback is kept in a ref so the socket connection is stable across
 * renders — changing the callback will not reconnect the socket.
 */
export function useLoginModalSettingsWebSocket({
  onSettingsUpdated,
}: UseLoginModalSettingsWebSocketOptions = {}): void {
  const callbackRef = useRef(onSettingsUpdated);
  callbackRef.current = onSettingsUpdated;

  useEffect(() => {
    const socket = io(getCalendarSocketUrl(), CALENDAR_SOCKET_IO_OPTIONS);

    socket.on('loginModalSettingsUpdated', () => {
      callbackRef.current?.();
    });

    return () => {
      socket.off('loginModalSettingsUpdated');
      socket.disconnect();
    };
  }, []);
}
