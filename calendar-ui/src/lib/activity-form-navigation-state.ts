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
  activityListPageIndex?: number | null
): { state: ActivityFormNavigationState };
export function activityFormLinkState(
  location: Pick<Location, 'pathname' | 'search' | 'hash'>,
  activityListScrollTop?: number | null,
  activityListWindowScrollTop?: number | null,
  activityListPageIndex?: number | null
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
