import { io } from 'socket.io-client';
import { useEffect, useRef } from 'react';

interface UseActivityWebSocketOptions {
  onLockAcquired?: (lockedBy: { userId: number; username: string }) => void;
  onLockReleased?: () => void;
  onDataUpdated?: () => void;
}

/**
 * Subscribes to WebSocket events for a specific activity. Notifies the caller
 * when the lock status changes or when another user saves changes, so the
 * page can show banners and refresh data without polling.
 */
export function useActivityWebSocket(
  activityId: number,
  options: UseActivityWebSocketOptions
): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const socket = io(apiUrl);

    socket.on('connect', () => {
      socket.emit('viewActivity', activityId);
    });

    socket.on(
      'lockAcquired',
      (data: {
        activityId: number;
        lockedBy: { userId: number; username: string };
      }) => {
        if (data.activityId === activityId) {
          optionsRef.current.onLockAcquired?.(data.lockedBy);
        }
      }
    );

    socket.on('lockReleased', (data: { activityId: number }) => {
      if (data.activityId === activityId) {
        optionsRef.current.onLockReleased?.();
      }
    });

    socket.on('dataUpdated', (data: { activityId: number }) => {
      if (data.activityId === activityId) {
        optionsRef.current.onDataUpdated?.();
      }
    });

    return () => {
      socket.emit('leaveActivity', activityId);
      socket.off('lockAcquired');
      socket.off('lockReleased');
      socket.off('dataUpdated');
      socket.disconnect();
    };
  }, [activityId]);
}
