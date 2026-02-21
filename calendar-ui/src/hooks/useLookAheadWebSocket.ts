import { io } from 'socket.io-client';
import { useEffect } from 'react';

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
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const socket = io(apiUrl);

    socket.on('connect', () => {
      socket.emit('subscribeToActivities');
    });

    socket.on('activityCreated', () => {
      onActivityUpdate?.();
    });

    socket.on('activityUpdated', () => {
      onActivityUpdate?.();
    });

    return () => {
      socket.emit('unsubscribeFromActivities');
      socket.off('activityCreated');
      socket.off('activityUpdated');
      socket.disconnect();
    };
  }, [onActivityUpdate]);
}
