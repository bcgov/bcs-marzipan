import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/errors';

import {
  isSavedFilterDuplicateNameConflict,
  SAVED_FILTER_DUPLICATE_NAME_DETAIL_SNIPPET,
} from './savedFilterDuplicateName';

function makeApiError(status: number, detail: string): ApiError {
  return new ApiError({
    type: 'about:blank',
    title: 'Error',
    status,
    detail,
    instance: '',
    correlationId: 'c1',
  });
}

describe('isSavedFilterDuplicateNameConflict', () => {
  it('is true for 409 with stable duplicate-name detail', () => {
    expect(
      isSavedFilterDuplicateNameConflict(
        makeApiError(409, SAVED_FILTER_DUPLICATE_NAME_DETAIL_SNIPPET)
      )
    ).toBe(true);
  });

  it('is false for 409 with other detail', () => {
    expect(
      isSavedFilterDuplicateNameConflict(
        makeApiError(409, 'Some other conflict')
      )
    ).toBe(false);
  });

  it('is false for non-ApiError', () => {
    expect(isSavedFilterDuplicateNameConflict(new Error('x'))).toBe(false);
  });
});
