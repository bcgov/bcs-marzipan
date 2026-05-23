import { useContext, useEffect, useRef } from 'react';

import {
  LiveActivitySyncContext,
  type LiveActivitySyncContextValue,
} from '@/contexts/LiveActivitySyncContext.context';

/**
 * Reads shared live activity sync state from {@link LiveActivitySyncProvider}.
 */
export function useLiveActivitySyncContext(): LiveActivitySyncContextValue {
  const context = useContext(LiveActivitySyncContext);
  if (!context) {
    throw new Error(
      'useLiveActivitySyncContext must be used within LiveActivitySyncProvider'
    );
  }
  return context;
}

/**
 * Returns shared highlight IDs for table/preview rows. When `isFetching` settles
 * after a remote invalidation, pending highlight IDs are promoted so every mounted
 * surface flashes the same activities.
 */
export function useLiveActivityRowHighlights(
  isFetching: boolean
): ReadonlySet<number> {
  const { highlightedActivityIds, promotePendingHighlights } =
    useLiveActivitySyncContext();
  const prevFetchingRef = useRef(isFetching);

  useEffect(() => {
    const wasFetching = prevFetchingRef.current;
    prevFetchingRef.current = isFetching;
    if (wasFetching && !isFetching) {
      promotePendingHighlights();
    }
  }, [isFetching, promotePendingHighlights]);

  return highlightedActivityIds;
}
