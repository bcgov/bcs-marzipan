import type { ManagerOptions, SocketOptions } from 'socket.io-client';

/**
 * Base URL for Socket.IO connections.
 *
 * VITE_API_BASE_URL is shared with axios (REST), but Socket.IO interprets a
 * string that starts with '/' as a namespace, not a base path. When the value
 * is a relative URL (e.g. '/api' in OpenShift), return window.location.origin
 * so the socket connects to the page host where nginx proxies /socket.io/ to
 * the calendar-service. Absolute URLs (local dev: 'http://localhost:3001') are
 * passed through unchanged because Socket.IO handles them correctly.
 */
export function getCalendarSocketUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  // Relative path → use current origin so Engine.IO hits /socket.io/ on the
  // nginx host, which now has a dedicated proxy block for that path.
  if (base.startsWith('/')) {
    return window.location.origin;
  }
  return base;
}

/**
 * Default client options: send cookies on the handshake (httpOnly session), same as `api/axios`.
 */
export const CALENDAR_SOCKET_IO_OPTIONS = {
  withCredentials: true,
} as const satisfies Partial<ManagerOptions & SocketOptions>;
