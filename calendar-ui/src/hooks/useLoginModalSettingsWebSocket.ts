import { io } from 'socket.io-client';
import { useEffect } from 'react';

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
 */
export function useLoginModalSettingsWebSocket({
  onSettingsUpdated,
}: UseLoginModalSettingsWebSocketOptions = {}): void {
  useEffect(() => {
    const socket = io(getCalendarSocketUrl(), CALENDAR_SOCKET_IO_OPTIONS);

    socket.on('loginModalSettingsUpdated', () => {
      onSettingsUpdated?.();
    });

    return () => {
      socket.off('loginModalSettingsUpdated');
      socket.disconnect();
    };
  }, [onSettingsUpdated]);
}
