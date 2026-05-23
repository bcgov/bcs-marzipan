import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useLiveActivitySync } from '@/hooks/useLiveActivitySync';
import {
  LIVE_ROW_HIGHLIGHT_ANIMATION_MS,
  registerRemoteHighlightQueue,
} from '@/lib/liveActivitySync';

import {
  LiveActivitySyncContext,
  type LiveActivitySyncContextValue,
} from './LiveActivitySyncContext.context';

interface LiveActivitySyncProviderProps {
  children: ReactNode;
}

/**
 * Single app-shell Socket.IO subscriber for activity table + report refresh.
 * Mount once under authenticated layout so routes share one connection and one
 * highlight set (activity table + reports preview flash together after remote edits).
 */
export function LiveActivitySyncProvider({
  children,
}: LiveActivitySyncProviderProps) {
  const { isSocketConnected } = useLiveActivitySync();
  const pendingHighlightIdsRef = useRef(new Set<number>());
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [highlightedActivityIds, setHighlightedActivityIds] = useState<
    ReadonlySet<number>
  >(() => new Set());

  const queueRemoteHighlight = useCallback((activityId: number) => {
    pendingHighlightIdsRef.current.add(activityId);
  }, []);

  const promotePendingHighlights = useCallback(() => {
    if (pendingHighlightIdsRef.current.size === 0) return;

    const pending = [...pendingHighlightIdsRef.current];
    pendingHighlightIdsRef.current.clear();

    setHighlightedActivityIds((prev) => new Set([...prev, ...pending]));

    if (clearTimerRef.current !== null) {
      clearTimeout(clearTimerRef.current);
    }
    clearTimerRef.current = setTimeout(() => {
      setHighlightedActivityIds(new Set());
      clearTimerRef.current = null;
    }, LIVE_ROW_HIGHLIGHT_ANIMATION_MS);
  }, []);

  useEffect(() => {
    return registerRemoteHighlightQueue({ queueRemoteHighlight });
  }, [queueRemoteHighlight]);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current !== null) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  const value: LiveActivitySyncContextValue = {
    isSocketConnected,
    highlightedActivityIds,
    promotePendingHighlights,
  };

  return (
    <LiveActivitySyncContext.Provider value={value}>
      {children}
    </LiveActivitySyncContext.Provider>
  );
}
