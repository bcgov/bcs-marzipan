import type { ActivityFieldScope } from '@corpcal/shared';

import { useActivityEdit } from './activity-edit-context';

/** Shown when the user may view a scoped field but lacks edit permission for that scope. */
export const ACTIVITY_FIELD_PERMISSION_DENIED_MESSAGE =
  'You do not have permission to edit this field.';

/**
 * Drives activity form controls for a field scope:
 * - `readOnly`: activity-level view-only (lock, API `canEdit`, etc.) — full-contrast static styling.
 * - `permissionMuted`: may view this scope but not edit — muted `disabled` styling (other teams / grants).
 */
export function useActivityFieldScopeControl(scope: ActivityFieldScope) {
  const { readOnly, canViewFieldScope, canEditFieldScope } = useActivityEdit();
  const canView = canViewFieldScope?.(scope) ?? true;
  const canEdit = canEditFieldScope?.(scope) ?? true;
  const permissionMuted = !readOnly && canView && !canEdit;

  return {
    readOnly,
    permissionMuted,
    showPermissionTooltip: permissionMuted,
  };
}
