import { beforeEach, describe, expect, it } from 'vitest';

import type { ActivityInfoIconSettings } from '@corpcal/shared/schemas';

import {
  readCachedActivityInfoIconSettings,
  shouldRetryActivityInfoIconSettings,
  writeCachedActivityInfoIconSettings,
} from './activityInfoIconSettingsApi';
import { ApiError } from './errors';

const SAMPLE_SETTINGS: ActivityInfoIconSettings = {
  items: [
    {
      fieldKey: 'visibility',
      text: 'Visibility help text',
    },
  ],
};

describe('activityInfoIconSettingsApi cache', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('scopes cache by authenticated user id', () => {
    window.sessionStorage.setItem('corpcal_auth_user_id', '101');
    writeCachedActivityInfoIconSettings(SAMPLE_SETTINGS);

    window.sessionStorage.setItem('corpcal_auth_user_id', '202');
    expect(readCachedActivityInfoIconSettings()).toBeNull();

    window.sessionStorage.setItem('corpcal_auth_user_id', '101');
    expect(readCachedActivityInfoIconSettings()).toEqual(SAMPLE_SETTINGS);
  });

  it('returns null when cached payload is invalid', () => {
    window.sessionStorage.setItem('corpcal_auth_user_id', '101');
    writeCachedActivityInfoIconSettings(SAMPLE_SETTINGS);
    const key = Object.keys(window.localStorage)[0];
    expect(key).toBeTruthy();

    // Overwrite with malformed payload under the same scoped key.
    window.localStorage.setItem(key, '{"items":"invalid"}');

    expect(readCachedActivityInfoIconSettings()).toBeNull();
  });
});

describe('activityInfoIconSettingsApi retry policy', () => {
  it('retries on 429 ApiError up to max attempts', () => {
    const tooManyRequests = new ApiError({
      type: 'https://example.test/errors/429',
      title: 'Too Many Requests',
      status: 429,
      detail: 'Rate limited',
      instance: '/settings/activity-info-icons',
      correlationId: 'abc123',
    });

    expect(shouldRetryActivityInfoIconSettings(0, tooManyRequests)).toBe(true);
    expect(shouldRetryActivityInfoIconSettings(2, tooManyRequests)).toBe(true);
    expect(shouldRetryActivityInfoIconSettings(3, tooManyRequests)).toBe(false);
  });

  it('does not retry non-429 errors', () => {
    const genericError = new Error('boom');
    expect(shouldRetryActivityInfoIconSettings(0, genericError)).toBe(false);
  });
});
