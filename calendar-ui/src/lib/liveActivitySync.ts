import type { QueryClient } from '@tanstack/react-query';

import { reportQueryKeys } from './reportQueryKeys';

/** Debounce window for batched refresh after activity broadcasts or local saves. */
export const LIVE_ACTIVITY_REFRESH_DEBOUNCE_MS = 1_500;

/** Matches CSS animation duration used for `.live-row-highlight`. */
export const LIVE_ROW_HIGHLIGHT_ANIMATION_MS = 1_500;

const remoteHighlightActivityIds = new Set<number>();

let debounceFlushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingInvalidateActivities = false;

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
      remoteHighlightActivityIds.add(options.activityId);
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

/**
 * Copies and clears queued remote-highlight activity IDs. Call when refetch settles
 * (e.g. `isFetching` false) so refreshed rows animate.
 */
export function consumeRemoteHighlightIds(): number[] {
  const ids = [...remoteHighlightActivityIds];
  remoteHighlightActivityIds.clear();
  return ids;
}

/** @internal resets module timers and highlight queue (Vitest only). */
export function __resetLiveActivitySyncForTests(): void {
  if (debounceFlushTimer !== null) {
    clearTimeout(debounceFlushTimer);
    debounceFlushTimer = null;
  }
  pendingInvalidateActivities = false;
  remoteHighlightActivityIds.clear();
}
