import { createContext } from 'react';

export interface LiveActivitySyncContextValue {
  isSocketConnected: boolean;
  /** Activity IDs currently flashing after a remote update (shared across all surfaces). */
  highlightedActivityIds: ReadonlySet<number>;
  /**
   * Promotes queued remote highlight IDs into {@link highlightedActivityIds}.
   * Call when a subscribed query finishes refetching (`isFetching` → false).
   */
  promotePendingHighlights: () => void;
}

export const LiveActivitySyncContext = createContext<
  LiveActivitySyncContextValue | undefined
>(undefined);
