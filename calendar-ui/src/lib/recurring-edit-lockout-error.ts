import {
  RECURRING_EDIT_LOCKOUT_MESSAGE,
  RECURRING_EDIT_LOCKOUT_REASON,
} from '@corpcal/shared';
import { ApiError } from '@/api/errors';

export const RECURRING_EDIT_LOCKOUT_UI_MESSAGE =
  'Cannot edit right now. Editing is locked during the scheduled lockout window.';

export function isRecurringEditLockoutError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError && error.reason === RECURRING_EDIT_LOCKOUT_REASON
  );
}

export function getRecurringEditLockoutErrorMessage(
  error: unknown
): string | undefined {
  return isRecurringEditLockoutError(error)
    ? RECURRING_EDIT_LOCKOUT_UI_MESSAGE
    : undefined;
}

export function getRecurringEditLockoutDetailFallback(
  detail: string | undefined
): boolean {
  return (
    typeof detail === 'string' &&
    detail.toLowerCase().includes('lockout window')
  );
}

export { RECURRING_EDIT_LOCKOUT_MESSAGE, RECURRING_EDIT_LOCKOUT_REASON };
