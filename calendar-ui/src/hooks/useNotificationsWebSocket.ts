import { io } from 'socket.io-client';
import { useEffect, useRef } from 'react';

import {
  CALENDAR_SOCKET_IO_OPTIONS,
  getCalendarSocketUrl,
} from '@/lib/calendar-socket';

interface UseNotificationsWebSocketOptions {
  onNotificationsChanged?: () => void;
}

/**
 * Subscribes to user-targeted notification invalidation events.
 */
export function useNotificationsWebSocket(
  options: UseNotificationsWebSocketOptions = {}
): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const socket = io(getCalendarSocketUrl(), CALENDAR_SOCKET_IO_OPTIONS);

    socket.on('notificationsChanged', () => {
      optionsRef.current.onNotificationsChanged?.();
    });

    return () => {
      socket.off('notificationsChanged');
      socket.disconnect();
    };
  }, []);
}
