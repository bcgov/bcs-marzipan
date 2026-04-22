import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { lookupGetCacheControl } from './cache-control';

describe('lookupGetCacheControl', () => {
  let previousNodeEnv: string | undefined;

  beforeEach(() => {
    previousNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it('returns private, no-cache in production', () => {
    process.env.NODE_ENV = 'production';
    expect(lookupGetCacheControl()).toBe('private, no-cache');
  });

  it('returns no-store when NODE_ENV is not production', () => {
    for (const env of ['development', 'test', 'staging'] as const) {
      process.env.NODE_ENV = env;
      expect(lookupGetCacheControl()).toBe('no-store');
    }
  });

  it('returns no-store when NODE_ENV is unset', () => {
    delete process.env.NODE_ENV;
    expect(lookupGetCacheControl()).toBe('no-store');
  });
});
