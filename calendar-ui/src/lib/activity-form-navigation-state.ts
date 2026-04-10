import type { Location } from 'react-router-dom';

/**
 * Passed as {@link Location.state} when navigating into create/edit activity routes
 * so "Go back" can return to the originating screen (including query/hash).
 */
export type ActivityFormNavigationState = {
  from: string;
};

/**
 * Builds `state` for {@link Link} or `navigate(url, options)` when entering
 * create/edit activity flows from the current page.
 */
export function activityFormLinkState(
  location: Pick<Location, 'pathname' | 'search' | 'hash'>
): { state: ActivityFormNavigationState } {
  return {
    state: {
      from: `${location.pathname}${location.search}${location.hash}`,
    },
  };
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
