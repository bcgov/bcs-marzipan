import { describe, expect, it } from 'vitest';

import { ApiError, createApiError, NetworkError } from './errors';

function sampleProblemDetails() {
  return {
    type: 'about:blank',
    title: 'Not Found',
    status: 404,
    detail: 'Activity not found',
    instance: '/activities/1',
    correlationId: 'corr-1',
  };
}

describe('createApiError', () => {
  it('returns the same ApiError instance when already normalized', () => {
    const apiError = new ApiError(sampleProblemDetails());
    expect(createApiError(apiError)).toBe(apiError);
  });

  it('returns the same NetworkError instance when already normalized', () => {
    const networkError = new NetworkError('Offline', 'corr-2');
    expect(createApiError(networkError)).toBe(networkError);
  });
});
