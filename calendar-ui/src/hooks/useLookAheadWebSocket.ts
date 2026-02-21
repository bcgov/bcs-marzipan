import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useEffect } from 'react';

import { getActivityUpdatedToastOptions } from '@/lib/activity-toast-options';

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
          id: `activity-created-${data.id}`,
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
        toast.info(
          'Activity updated',
          getActivityUpdatedToastOptions({
            id: String(data.id),
            title: data.title,
            displayId: data.displayId,
          })
        );
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
