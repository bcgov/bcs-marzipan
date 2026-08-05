import {
  getActivityListFocusActivityId,
  getActivityListPageIndex,
  getActivityListScrollTop,
  getActivityListWindowScrollTop,
} from '@/lib/activity-form-navigation-state';

export const ACTIVITY_LIST_SCROLL_STATE_KEY = 'activityListScrollState';
const ACTIVITY_LIST_SCROLL_DEBUG_KEY = 'activityListScrollDebug';

export type StoredActivityListScrollState = {
  activityListPageIndex?: number;
  activityListScrollTop?: number;
  activityListWindowScrollTop?: number;
  activityListFocusActivityId?: number;
};

export type ActivityListScrollRestorePending = {
  focusActivityId: number | null;
  pageIndex: number | null;
  containerScrollTop: number | null;
  windowScrollTop: number | null;
};

/** Survives React StrictMode remount after sessionStorage is cleared post-restore. */
let strictModeScrollRestoreFallback: ActivityListScrollRestorePending | null =
  null;

export function stashStrictModeScrollRestoreFallback(
  pending: ActivityListScrollRestorePending
): void {
  strictModeScrollRestoreFallback = pending;
}

export function takeStrictModeScrollRestoreFallback(): ActivityListScrollRestorePending | null {
  const pending = strictModeScrollRestoreFallback;
  strictModeScrollRestoreFallback = null;
  return pending;
}

export function clearStrictModeScrollRestoreFallback(): void {
  strictModeScrollRestoreFallback = null;
}

export function parseStoredActivityListScrollState(
  raw: string | null
): StoredActivityListScrollState | null {
  if (raw == null) return null;
  try {
    const parsed = JSON.parse(raw) as StoredActivityListScrollState;
    const pageIndex = parsed.activityListPageIndex;
    const containerScrollTop = parsed.activityListScrollTop;
    const windowScrollTop = parsed.activityListWindowScrollTop;
    const focusActivityId = parsed.activityListFocusActivityId;
    return {
      activityListPageIndex:
        typeof pageIndex === 'number' &&
        Number.isInteger(pageIndex) &&
        pageIndex >= 0
          ? pageIndex
          : undefined,
      activityListScrollTop:
        typeof containerScrollTop === 'number' &&
        Number.isFinite(containerScrollTop)
          ? containerScrollTop
          : undefined,
      activityListWindowScrollTop:
        typeof windowScrollTop === 'number' && Number.isFinite(windowScrollTop)
          ? windowScrollTop
          : undefined,
      activityListFocusActivityId:
        typeof focusActivityId === 'number' &&
        Number.isInteger(focusActivityId) &&
        focusActivityId > 0
          ? focusActivityId
          : undefined,
    };
  } catch {
    return null;
  }
}

export function writeStoredActivityListScrollState(
  state: StoredActivityListScrollState
): void {
  if (typeof window === 'undefined') return;
  try {
    const existing =
      parseStoredActivityListScrollState(
        window.sessionStorage.getItem(ACTIVITY_LIST_SCROLL_STATE_KEY)
      ) ?? {};
    const merged: StoredActivityListScrollState = { ...existing };
    if (state.activityListPageIndex !== undefined) {
      merged.activityListPageIndex = state.activityListPageIndex;
    }
    if (state.activityListScrollTop !== undefined) {
      merged.activityListScrollTop = state.activityListScrollTop;
    }
    if (state.activityListWindowScrollTop !== undefined) {
      merged.activityListWindowScrollTop = state.activityListWindowScrollTop;
    }
    if (state.activityListFocusActivityId !== undefined) {
      merged.activityListFocusActivityId = state.activityListFocusActivityId;
    }
    window.sessionStorage.setItem(
      ACTIVITY_LIST_SCROLL_STATE_KEY,
      JSON.stringify(merged)
    );
  } catch {
    // ignore
  }
}

export function clearStoredActivityListScrollState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(ACTIVITY_LIST_SCROLL_STATE_KEY);
  } catch {
    // ignore
  }
}

export function hasPendingActivityListScrollRestore(
  pending: ActivityListScrollRestorePending
): boolean {
  return (
    pending.focusActivityId != null ||
    pending.pageIndex != null ||
    pending.containerScrollTop != null ||
    pending.windowScrollTop != null
  );
}

export type ResolveActivityListScrollRestoreOptions = {
  /** When false, sessionStorage is only used to merge focus id into location.state. */
  allowSessionStorageFallback?: boolean;
};

/**
 * Merges router location.state with sessionStorage so in-app back (state) still
 * picks up focus id from storage when only partial fields were forwarded.
 * SessionStorage-only restore is gated by `allowSessionStorageFallback` (browser POP).
 */
export function resolveActivityListScrollRestorePending(
  locationState: unknown,
  storageRaw: string | null,
  options?: ResolveActivityListScrollRestoreOptions
): { pending: ActivityListScrollRestorePending; source: string } | null {
  const allowSessionStorageFallback =
    options?.allowSessionStorageFallback ?? false;

  const fromStatePageIndex = getActivityListPageIndex(locationState);
  const fromStateScrollTop = getActivityListScrollTop(locationState);
  const fromStateWindowScrollTop =
    getActivityListWindowScrollTop(locationState);
  const fromStateFocusActivityId =
    getActivityListFocusActivityId(locationState);

  const hasStateScrollFields =
    fromStatePageIndex != null ||
    fromStateScrollTop != null ||
    fromStateWindowScrollTop != null ||
    fromStateFocusActivityId != null;

  const stored =
    hasStateScrollFields || allowSessionStorageFallback
      ? parseStoredActivityListScrollState(storageRaw)
      : null;

  if (!hasStateScrollFields && stored == null) {
    return null;
  }

  const pending: ActivityListScrollRestorePending = {
    pageIndex: fromStatePageIndex ?? stored?.activityListPageIndex ?? null,
    containerScrollTop:
      fromStateScrollTop ?? stored?.activityListScrollTop ?? null,
    windowScrollTop:
      fromStateWindowScrollTop ?? stored?.activityListWindowScrollTop ?? null,
    focusActivityId:
      fromStateFocusActivityId ?? stored?.activityListFocusActivityId ?? null,
  };

  if (!hasPendingActivityListScrollRestore(pending)) {
    return null;
  }

  let source = 'none';
  if (hasStateScrollFields && stored != null) {
    source = 'location.state+sessionStorage';
  } else if (hasStateScrollFields) {
    source = 'location.state';
  } else {
    source = 'sessionStorage';
  }

  return { pending, source };
}

export function recordScrollRestoreDebug(
  event: string,
  payload: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  if (!import.meta.env.DEV) return;
  const entry = {
    event,
    at: new Date().toISOString(),
    ...payload,
  };
  console.debug('[scroll-restore]', entry);
  try {
    const existingRaw = window.sessionStorage.getItem(
      ACTIVITY_LIST_SCROLL_DEBUG_KEY
    );
    const parsed = JSON.parse(existingRaw ?? '[]') as unknown;
    const existing = Array.isArray(parsed) ? parsed : [];
    const next = [...existing, entry].slice(-40);
    window.sessionStorage.setItem(
      ACTIVITY_LIST_SCROLL_DEBUG_KEY,
      JSON.stringify(next)
    );
  } catch {
    // ignore
  }
}
