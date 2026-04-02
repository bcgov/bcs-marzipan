import type { ActivityFieldScope } from '@corpcal/shared';

import { useActivityEdit } from './activity-edit-context';

/** Shown when the user may view a scoped field but lacks edit permission for that scope. */
export const ACTIVITY_FIELD_PERMISSION_DENIED_MESSAGE =
  'You do not have permission to edit this field.';

/**
 * Drives activity form controls for a field scope:
 * - `readOnly`: activity-level view-only (lock, API `canEdit`, etc.) — full-contrast static styling.
 * - `permissionMuted`: may view this scope but not edit — muted `disabled` styling (other teams / grants).
 * - `fieldScopeDisabled`: activity allows edit but this scope blocks interaction (no view, no edit, or
 *   provider omitted). Prefer this for `disabled` on scoped controls; without
 *   `canViewFieldScope` / `canEditFieldScope` from context, defaults fail closed.
 */
export function useActivityFieldScopeControl(scope: ActivityFieldScope) {
  const { readOnly, canViewFieldScope, canEditFieldScope } = useActivityEdit();
  const canView = canViewFieldScope?.(scope) ?? false;
  const canEdit = canEditFieldScope?.(scope) ?? false;
  const permissionMuted = !readOnly && canView && !canEdit;
  const fieldScopeDisabled = !readOnly && (!canView || !canEdit);

  return {
    readOnly,
    permissionMuted,
    fieldScopeDisabled,
    showPermissionTooltip: permissionMuted,
  };
}
