import type { ManagerOptions, SocketOptions } from 'socket.io-client';

/**
 * Base URL for Socket.IO (same host as REST API). Matches axios base URL usage.
 */
export function getCalendarSocketUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
}

/**
 * Default client options: send cookies on the handshake (httpOnly session), same as `api/axios`.
 */
export const CALENDAR_SOCKET_IO_OPTIONS = {
  withCredentials: true,
} as const satisfies Partial<ManagerOptions & SocketOptions>;
