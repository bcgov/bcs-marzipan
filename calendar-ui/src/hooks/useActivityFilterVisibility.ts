/**
 * Hook to determine which activity table filters are visible based on user permissions.
 * Only filters with specific permission requirements are scoped; most filters are always visible.
 *
 * This reduces UI clutter and prevents confusion for users without advanced permissions.
 * For example, a Viewer doesn't need to see the Look Ahead filter since it's an admin-level
 * operational metric.
 *
 * Filter visibility rules:
 * - Look Ahead: Admin+ only (reduces clutter for regular users)
 * - Event Planner: Advanced Viewer+ only (detailed planning view)
 * - Translations: Advanced Viewer+ only (editorial workflow)
 * - All other filters: visible to everyone (Date, Category, Status, Tags, Lead team, Comms contact)
 *
 * @example
 * const { lookAhead, eventPlanner, translations } = useActivityFilterVisibility();
 * if (lookAhead) {
 *   // Render Look Ahead filter
 * }
 */
import { PERMISSIONS } from '@corpcal/shared';

import { useAuth } from './useAuth';

export interface ActivityFilterVisibility {
  lookAhead: boolean;
  eventPlanner: boolean;
  translations: boolean;
}

/**
 * Determine which filters should be visible to the current user based on their permissions.
 *
 * Permissions are checked at runtime against the user's JWT token. Hidden filters
 * don't render, so they never clutter the UI. Saved filters with hidden criteria
 * are silently ignored on query execution (the filter state persists but isn't used).
 *
 * @returns Object with visibility booleans for each scoped filter
 */
export function useActivityFilterVisibility(): ActivityFilterVisibility {
  const { hasPermission } = useAuth();

  return {
    // Look Ahead filter: Admin+ only (reduces clutter for regular users)
    lookAhead: hasPermission(PERMISSIONS.ACTIVITIES.FILTERS.VIEW_LOOK_AHEAD),

    // Event Planner filter: Advanced Viewer+ (for detailed planning)
    eventPlanner: hasPermission(
      PERMISSIONS.ACTIVITIES.FILTERS.VIEW_EVENT_PLANNER
    ),

    // Translation filters: Advanced Viewer+ (for editorial workflow)
    translations: hasPermission(
      PERMISSIONS.ACTIVITIES.FILTERS.VIEW_TRANSLATIONS
    ),
  };
}
