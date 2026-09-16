import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/errors';
import {
  getRecurringEditLockoutErrorMessage,
  isRecurringEditLockoutError,
  RECURRING_EDIT_LOCKOUT_UI_MESSAGE,
} from '@/lib/recurring-edit-lockout-error';

function makeLockoutError(): ApiError {
  return new ApiError({
    type: 'https://api.example.com/errors/forbidden',
    title: 'Forbidden',
    status: 403,
    detail: 'Editing activities is locked for the current lockout window.',
    instance: '/locks',
    correlationId: 'test-correlation-id',
    reason: 'time_lockout',
  });
}

describe('isRecurringEditLockoutError', () => {
  it('returns true for ApiError with reason time_lockout', () => {
    expect(isRecurringEditLockoutError(makeLockoutError())).toBe(true);
  });

  it('returns false for other ApiError reasons', () => {
    const error = new ApiError({
      type: 'https://api.example.com/errors/forbidden',
      title: 'Forbidden',
      status: 403,
      detail: 'Forbidden',
      instance: '/activities/1',
      correlationId: 'test-correlation-id',
    });

    expect(isRecurringEditLockoutError(error)).toBe(false);
  });
});

describe('getRecurringEditLockoutErrorMessage', () => {
  it('returns the UI message for lockout errors', () => {
    expect(getRecurringEditLockoutErrorMessage(makeLockoutError())).toBe(
      RECURRING_EDIT_LOCKOUT_UI_MESSAGE
    );
  });

  it('returns undefined for non-lockout errors', () => {
    expect(
      getRecurringEditLockoutErrorMessage(new Error('nope'))
    ).toBeUndefined();
  });
});
