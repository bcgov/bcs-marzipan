import type { QueryClient } from '@tanstack/react-query';

import { reportQueryKeys } from './reportQueryKeys';

/** Debounce window for batched refresh after activity broadcasts or local saves. */
export const LIVE_ACTIVITY_REFRESH_DEBOUNCE_MS = 1_500;

/** Matches CSS animation duration used for `.live-row-highlight`. */
export const LIVE_ROW_HIGHLIGHT_ANIMATION_MS = 1_500;

export type RemoteHighlightQueue = {
  queueRemoteHighlight: (activityId: number) => void;
};

let remoteHighlightQueue: RemoteHighlightQueue | null = null;

let debounceFlushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingInvalidateActivities = false;

/** Registers the React highlight queue (mount via {@link LiveActivitySyncProvider}). */
export function registerRemoteHighlightQueue(
  queue: RemoteHighlightQueue
): () => void {
  remoteHighlightQueue = queue;
  return () => {
    if (remoteHighlightQueue === queue) {
      remoteHighlightQueue = null;
    }
  };
}

function flushInvalidate(queryClient: QueryClient): void {
  debounceFlushTimer = null;
  const invalidateActivities = pendingInvalidateActivities;
  pendingInvalidateActivities = false;

  void queryClient.invalidateQueries({ queryKey: reportQueryKeys.all });
  if (invalidateActivities) {
    void queryClient.invalidateQueries({ queryKey: ['activities'] });
  }
}

export type LiveActivityRefreshSource = 'remote' | 'local';

export interface ScheduleLiveActivityRefreshOptions {
  /** Included for `source: remote` WebSocket payloads to drive row flashes after refetch. */
  activityId?: number;
  source: LiveActivityRefreshSource;
  /**
   * For `source: local`, whether the debounced flush also invalidates activity lists.
   * Defaults to false because mutations already invalidate activities immediately.
   */
  invalidateActivities?: boolean;
}

/** Debounced invalidation of report data + activity lists (coalesces bursts). */
export function scheduleLiveActivityRefresh(
  queryClient: QueryClient,
  options: ScheduleLiveActivityRefreshOptions
): void {
  if (options.source === 'remote') {
    pendingInvalidateActivities = true;
    if (
      typeof options.activityId === 'number' &&
      Number.isFinite(options.activityId)
    ) {
      remoteHighlightQueue?.queueRemoteHighlight(options.activityId);
    }
  } else if (options.invalidateActivities === true) {
    pendingInvalidateActivities = true;
  }

  if (debounceFlushTimer !== null) {
    clearTimeout(debounceFlushTimer);
  }
  debounceFlushTimer = setTimeout(() => {
    flushInvalidate(queryClient);
  }, LIVE_ACTIVITY_REFRESH_DEBOUNCE_MS);
}

/** @internal resets module timers (Vitest only). */
export function __resetLiveActivitySyncForTests(): void {
  if (debounceFlushTimer !== null) {
    clearTimeout(debounceFlushTimer);
    debounceFlushTimer = null;
  }
  pendingInvalidateActivities = false;
  remoteHighlightQueue = null;
}
