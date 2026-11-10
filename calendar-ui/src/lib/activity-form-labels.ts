/**
 * Activity field labels for calendar-ui (wraps shared labels with form-specific aliases).
 */
import { getActivityFieldLabel as getSharedActivityFieldLabel } from '@corpcal/shared/utils';

/**
 * Maps an activity field name to a user-friendly label.
 * `organizations` validation maps to Lead organization in the split form UI.
 */
export function getActivityFieldLabel(fieldName: string): string {
  if (fieldName === 'organizations') {
    return getSharedActivityFieldLabel('leadOrganization');
  }
  return getSharedActivityFieldLabel(fieldName);
}
