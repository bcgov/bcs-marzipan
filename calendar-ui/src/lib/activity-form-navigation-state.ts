import type { Location } from 'react-router-dom';

/**
 * Passed as {@link Location.state} when navigating into create/edit activity routes
 * so "Go back" can return to the originating screen (including query/hash).
 */
export type ActivityFormNavigationState = {
  from: string;
  activityListScrollTop?: number;
  activityListWindowScrollTop?: number;
  activityListPageIndex?: number;
  activityListFocusActivityId?: number;
};

/**
 * Builds `state` for {@link Link} or `navigate(url, options)` when entering
 * create/edit activity flows from the current page.
 */
export function activityFormLinkState(
  location: Pick<Location, 'pathname' | 'search' | 'hash'>
): { state: ActivityFormNavigationState };
export function activityFormLinkState(
  location: Pick<Location, 'pathname' | 'search' | 'hash'>,
  activityListScrollTop: number | null | undefined,
  activityListWindowScrollTop?: number | null,
  activityListPageIndex?: number | null,
  activityListFocusActivityId?: number | null
): { state: ActivityFormNavigationState };
export function activityFormLinkState(
  location: Pick<Location, 'pathname' | 'search' | 'hash'>,
  activityListScrollTop?: number | null,
  activityListWindowScrollTop?: number | null,
  activityListPageIndex?: number | null,
  activityListFocusActivityId?: number | null
): { state: ActivityFormNavigationState } {
  const state: ActivityFormNavigationState = {
    from: `${location.pathname}${location.search}${location.hash}`,
  };

  if (
    typeof activityListScrollTop === 'number' &&
    Number.isFinite(activityListScrollTop)
  ) {
    state.activityListScrollTop = activityListScrollTop;
  }

  if (
    typeof activityListWindowScrollTop === 'number' &&
    Number.isFinite(activityListWindowScrollTop)
  ) {
    state.activityListWindowScrollTop = activityListWindowScrollTop;
  }

  if (
    typeof activityListPageIndex === 'number' &&
    Number.isInteger(activityListPageIndex) &&
    activityListPageIndex >= 0
  ) {
    state.activityListPageIndex = activityListPageIndex;
  }

  if (
    typeof activityListFocusActivityId === 'number' &&
    Number.isInteger(activityListFocusActivityId) &&
    activityListFocusActivityId > 0
  ) {
    state.activityListFocusActivityId = activityListFocusActivityId;
  }

  return { state };
}

/**
 * Returns a safe in-app path for "Go back", or null if state is missing/invalid.
 * Rejects open redirects (e.g. protocol-relative URLs).
 */
export function getActivityFormBackTarget(state: unknown): string | null {
  if (state === null || typeof state !== 'object') return null;
  const from = (state as { from?: unknown }).from;
  if (typeof from !== 'string' || from.length === 0) return null;
  if (!from.startsWith('/') || from.startsWith('//')) return null;
  return from;
}

export function getActivityListScrollTop(state: unknown): number | null {
  if (state === null || typeof state !== 'object') return null;
  const scrollTop = (state as { activityListScrollTop?: unknown })
    .activityListScrollTop;
  if (typeof scrollTop !== 'number' || !Number.isFinite(scrollTop)) {
    return null;
  }
  return scrollTop;
}

export function getActivityListWindowScrollTop(state: unknown): number | null {
  if (state === null || typeof state !== 'object') return null;
  const scrollTop = (state as { activityListWindowScrollTop?: unknown })
    .activityListWindowScrollTop;
  if (typeof scrollTop !== 'number' || !Number.isFinite(scrollTop)) {
    return null;
  }
  return scrollTop;
}

export function getActivityListPageIndex(state: unknown): number | null {
  if (state === null || typeof state !== 'object') return null;
  const pageIndex = (state as { activityListPageIndex?: unknown })
    .activityListPageIndex;
  if (
    typeof pageIndex !== 'number' ||
    !Number.isInteger(pageIndex) ||
    pageIndex < 0
  ) {
    return null;
  }
  return pageIndex;
}

export function getActivityListFocusActivityId(state: unknown): number | null {
  if (state === null || typeof state !== 'object') return null;
  const focusActivityId = (state as { activityListFocusActivityId?: unknown })
    .activityListFocusActivityId;
  if (
    typeof focusActivityId !== 'number' ||
    !Number.isInteger(focusActivityId) ||
    focusActivityId <= 0
  ) {
    return null;
  }
  return focusActivityId;
}

/**
 * Scroll-restore fields forwarded when returning to the activity list.
 * Omits `from` so stale restore state is not re-applied on later navigations.
 */
export function buildActivityListScrollRestoreReturnState(
  state: unknown,
  focusActivityId?: number | null
): Record<string, number> {
  const activityListPageIndex = getActivityListPageIndex(state);
  const activityListScrollTop = getActivityListScrollTop(state);
  const activityListWindowScrollTop = getActivityListWindowScrollTop(state);
  const activityListFocusActivityId =
    focusActivityId ?? getActivityListFocusActivityId(state);

  return {
    ...(activityListPageIndex != null && { activityListPageIndex }),
    ...(activityListScrollTop != null && { activityListScrollTop }),
    ...(activityListWindowScrollTop != null && {
      activityListWindowScrollTop,
    }),
    ...(activityListFocusActivityId != null && {
      activityListFocusActivityId,
    }),
  };
}
