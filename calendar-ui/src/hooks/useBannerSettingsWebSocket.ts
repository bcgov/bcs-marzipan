import { io } from 'socket.io-client';
import { useEffect, useRef } from 'react';

import {
  CALENDAR_SOCKET_IO_OPTIONS,
  getCalendarSocketUrl,
} from '@/lib/calendar-socket';

type UseBannerSettingsWebSocketOptions = {
  onSystemBannerSettingsUpdated?: () => void;
  onRecurringLockoutBannerSettingsUpdated?: () => void;
};

/**
 * Subscribes to banner settings update events so header banners refresh in
 * real time across tabs/users without requiring a page reload.
 */
export function useBannerSettingsWebSocket({
  onSystemBannerSettingsUpdated,
  onRecurringLockoutBannerSettingsUpdated,
}: UseBannerSettingsWebSocketOptions = {}): void {
  const systemUpdatedRef = useRef(onSystemBannerSettingsUpdated);
  const recurringUpdatedRef = useRef(onRecurringLockoutBannerSettingsUpdated);

  systemUpdatedRef.current = onSystemBannerSettingsUpdated;
  recurringUpdatedRef.current = onRecurringLockoutBannerSettingsUpdated;

  useEffect(() => {
    const socket = io(getCalendarSocketUrl(), CALENDAR_SOCKET_IO_OPTIONS);

    socket.on('systemBannerSettingsUpdated', () => {
      systemUpdatedRef.current?.();
    });

    socket.on('recurringLockoutBannerSettingsUpdated', () => {
      recurringUpdatedRef.current?.();
    });

    return () => {
      socket.off('systemBannerSettingsUpdated');
      socket.off('recurringLockoutBannerSettingsUpdated');
      socket.disconnect();
    };
  }, []);
}
