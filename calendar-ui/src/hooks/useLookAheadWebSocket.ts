import { useLiveActivitySync } from '@/hooks/useLiveActivitySync';

interface UseLookAheadWebSocketOptions {
  onActivityUpdate?: () => void;
}

/**
 * Subscribes to activity table WebSocket events and invokes the callback when
 * any activity is created or updated, so Look Ahead (or other consumers) can
 * refetch. Also participates in debounced TanStack invalidate via
 * {@link useLiveActivitySync}.
 */
export function useLookAheadWebSocket({
  onActivityUpdate,
}: UseLookAheadWebSocketOptions = {}): void {
  useLiveActivitySync({ legacyOnRemoteActivity: onActivityUpdate });
}
