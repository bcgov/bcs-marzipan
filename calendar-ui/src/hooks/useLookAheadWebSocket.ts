import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface UseLookAheadWebSocketOptions {
  onActivityUpdate?: () => void;
}

/**
 * Subscribes to activity table WebSocket events and refetches Look Ahead data
 * when any activity is created or updated (relevant activities are filtered server-side).
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

    socket.on(
      'activityCreated',
      (data: { id: number; title?: string; displayId?: string }) => {
        onActivityUpdate?.();
        toast.success('New activity created', {
          description: data.displayId
            ? `${data.displayId}: ${data.title ?? ''}`
            : data.title,
          duration: 5000,
        });
      }
    );

    socket.on(
      'activityUpdated',
      (data: { id: number; title?: string; displayId?: string }) => {
        onActivityUpdate?.();
        toast.info('Activity updated', {
          description: data.displayId
            ? `${data.displayId}: ${data.title ?? ''}`
            : data.title,
          duration: 5000,
        });
      }
    );

    return () => {
      socket.emit('unsubscribeFromActivities');
      socket.off('activityCreated');
      socket.off('activityUpdated');
      socket.disconnect();
    };
  }, [onActivityUpdate]);
}
