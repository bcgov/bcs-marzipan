import { ExecutionContext } from '@nestjs/common';
import type { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

import { RateLimitInterceptor } from './rate-limit.interceptor';

describe('RateLimitInterceptor', () => {
  let interceptor: RateLimitInterceptor;
  let mockContext: Partial<ExecutionContext>;
  let mockNext: { handle: () => any };

  beforeEach(() => {
    mockNext = { handle: () => of({}) };
  });

  function createHttpArgumentsHost(request: unknown): HttpArgumentsHost {
    return {
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => undefined,
    } as unknown as HttpArgumentsHost;
  }

  describe('store selection', () => {
    it('uses InMemoryRateLimitStore by default (memory mode)', () => {
      vi.spyOn(ConfigService.prototype, 'get').mockImplementation((key) => {
        if (key === 'RATE_LIMIT_MAX') return '100';
        if (key === 'RATE_LIMIT_STORE') return undefined;
        return undefined;
      });

      const testConfigService = new ConfigService();
      interceptor = new RateLimitInterceptor(testConfigService);

      // Access private store via type assertion to verify
      expect((interceptor as any).store).toBeDefined();
      expect((interceptor as any).store.constructor.name).toBe(
        'InMemoryRateLimitStore'
      );
    });

    it('uses InMemoryRateLimitStore when RATE_LIMIT_STORE=memory', () => {
      vi.spyOn(ConfigService.prototype, 'get').mockImplementation((key) => {
        if (key === 'RATE_LIMIT_MAX') return '100';
        if (key === 'RATE_LIMIT_STORE') return 'memory';
        return undefined;
      });

      const testConfigService = new ConfigService();
      interceptor = new RateLimitInterceptor(testConfigService);

      expect((interceptor as any).store.constructor.name).toBe(
        'InMemoryRateLimitStore'
      );
    });

    it('uses RedisRateLimitStore when RATE_LIMIT_STORE=redis and URL is set', () => {
      vi.spyOn(ConfigService.prototype, 'get').mockImplementation((key) => {
        if (key === 'RATE_LIMIT_MAX') return '100';
        if (key === 'RATE_LIMIT_STORE') return 'redis';
        if (key === 'RATE_LIMIT_REDIS_URL') return 'redis://localhost:6379';
        return undefined;
      });

      const testConfigService = new ConfigService();
      interceptor = new RateLimitInterceptor(testConfigService);

      expect((interceptor as any).store.constructor.name).toBe(
        'RedisRateLimitStore'
      );
    });

    it('falls back to InMemoryRateLimitStore when redis is configured but no URL provided', () => {
      vi.spyOn(ConfigService.prototype, 'get').mockImplementation((key) => {
        if (key === 'RATE_LIMIT_MAX') return '100';
        if (key === 'RATE_LIMIT_STORE') return 'redis';
        if (key === 'RATE_LIMIT_REDIS_URL') return undefined;
        if (key === 'REDIS_URL') return undefined;
        return undefined;
      });

      const testConfigService = new ConfigService();
      interceptor = new RateLimitInterceptor(testConfigService);

      expect((interceptor as any).store.constructor.name).toBe(
        'InMemoryRateLimitStore'
      );
    });

    it('reads RATE_LIMIT_MAX from config with default 100', () => {
      vi.spyOn(ConfigService.prototype, 'get').mockImplementation((key) => {
        if (key === 'RATE_LIMIT_MAX') return '200';
        if (key === 'RATE_LIMIT_STORE') return 'memory';
        return undefined;
      });

      const testConfigService = new ConfigService();
      interceptor = new RateLimitInterceptor(testConfigService);

      expect((interceptor as any).maxRequests).toBe(200);
    });

    it('defaults to 100 requests/min if RATE_LIMIT_MAX is not set', () => {
      vi.spyOn(ConfigService.prototype, 'get').mockImplementation(
        () => undefined
      );

      const testConfigService = new ConfigService();
      interceptor = new RateLimitInterceptor(testConfigService);

      expect((interceptor as any).maxRequests).toBe(100);
    });
  });

  describe('rate limit enforcement', () => {
    beforeEach(() => {
      vi.spyOn(ConfigService.prototype, 'get').mockImplementation((key) => {
        if (key === 'RATE_LIMIT_MAX') return '3';
        if (key === 'RATE_LIMIT_STORE') return 'memory';
        return undefined;
      });

      const testConfigService = new ConfigService();
      interceptor = new RateLimitInterceptor(testConfigService);
    });

    it('allows requests under the limit', async () => {
      const request = { url: '/api/test', ip: '127.0.0.1', headers: {} };
      mockContext = {
        switchToHttp: () => createHttpArgumentsHost(request),
      };

      await new Promise<void>((resolve, reject) => {
        interceptor
          .intercept(mockContext as ExecutionContext, mockNext)
          .subscribe({
            next: () => resolve(),
            error: (err) => reject(err),
          });
      });
    });

    it('blocks requests exceeding the limit', async () => {
      const request = { url: '/api/test', ip: '127.0.0.1', headers: {} };
      mockContext = {
        switchToHttp: () => createHttpArgumentsHost(request),
      };

      // Make 3 successful requests
      for (let i = 0; i < 3; i++) {
        await new Promise<void>((resolve, reject) => {
          interceptor
            .intercept(mockContext as ExecutionContext, mockNext)
            .subscribe({
              next: () => resolve(),
              error: (err) => reject(err),
            });
        });
      }

      // 4th request should be blocked
      await expect(
        new Promise<void>((resolve, reject) => {
          interceptor
            .intercept(mockContext as ExecutionContext, mockNext)
            .subscribe({
              next: () => reject(new Error('Should have been blocked')),
              error: (error) => {
                if (error.getStatus() === 429) {
                  resolve();
                } else {
                  const rejectionReason =
                    error instanceof Error ? error : new Error(String(error));
                  reject(rejectionReason);
                }
              },
            });
        })
      ).resolves.toBeUndefined();
    });

    it('applies stricter limits on sensitive auth endpoints', async () => {
      vi.spyOn(ConfigService.prototype, 'get').mockImplementation((key) => {
        if (key === 'RATE_LIMIT_MAX') return '10';
        if (key === 'RATE_LIMIT_AUTH_MAX') return '2';
        if (key === 'RATE_LIMIT_STORE') return 'memory';
        return undefined;
      });

      const testConfigService = new ConfigService();
      const authLimitedInterceptor = new RateLimitInterceptor(
        testConfigService
      );

      const authRequest = { url: '/auth/login', ip: '127.0.0.10', headers: {} };
      mockContext = {
        switchToHttp: () => createHttpArgumentsHost(authRequest),
      };

      // First two auth requests should pass
      for (let i = 0; i < 2; i++) {
        await new Promise<void>((resolve) => {
          authLimitedInterceptor
            .intercept(mockContext as ExecutionContext, mockNext)
            .subscribe({
              next: () => resolve(),
              error: (err) => {
                throw err;
              },
            });
        });
      }

      // Third auth request should be blocked by auth limit
      await expect(
        new Promise<void>((resolve, reject) => {
          authLimitedInterceptor
            .intercept(mockContext as ExecutionContext, mockNext)
            .subscribe({
              next: () =>
                reject(new Error('Auth request should have been blocked')),
              error: (error) => {
                if (error.getStatus() === 429) {
                  resolve();
                } else {
                  reject(
                    error instanceof Error ? error : new Error(String(error))
                  );
                }
              },
            });
        })
      ).resolves.toBeUndefined();
    });

    it('uses general limits for non-sensitive auth endpoints', async () => {
      vi.spyOn(ConfigService.prototype, 'get').mockImplementation((key) => {
        if (key === 'RATE_LIMIT_MAX') return '2';
        if (key === 'RATE_LIMIT_AUTH_MAX') return '1';
        if (key === 'RATE_LIMIT_STORE') return 'memory';
        return undefined;
      });

      const testConfigService = new ConfigService();
      const authLimitedInterceptor = new RateLimitInterceptor(
        testConfigService
      );

      const authConfigRequest = {
        url: '/auth/local/config',
        ip: '127.0.0.11',
        headers: {},
      };
      mockContext = {
        switchToHttp: () => createHttpArgumentsHost(authConfigRequest),
      };

      // Should use RATE_LIMIT_MAX (2) and not RATE_LIMIT_AUTH_MAX (1)
      for (let i = 0; i < 2; i++) {
        await new Promise<void>((resolve) => {
          authLimitedInterceptor
            .intercept(mockContext as ExecutionContext, mockNext)
            .subscribe({
              next: () => resolve(),
              error: (err) => {
                throw err;
              },
            });
        });
      }
    });

    it('bypasses rate limiting for /health endpoint', async () => {
      const request = { url: '/health', ip: '127.0.0.1', headers: {} };
      mockContext = {
        switchToHttp: () => createHttpArgumentsHost(request),
      };

      await new Promise<void>((resolve) => {
        interceptor
          .intercept(mockContext as ExecutionContext, mockNext)
          .subscribe({
            next: () => {
              resolve();
            },
            error: (err) => {
              throw err;
            },
          });
      });
    });

    it('bypasses rate limiting for /ready endpoint', async () => {
      const request = { url: '/ready', ip: '127.0.0.1', headers: {} };
      mockContext = {
        switchToHttp: () => createHttpArgumentsHost(request),
      };

      await new Promise<void>((resolve, reject) => {
        interceptor
          .intercept(mockContext as ExecutionContext, mockNext)
          .subscribe({
            next: () => resolve(),
            error: (err) => reject(err),
          });
      });
    });

    it('extracts IP from x-forwarded-for header when present', async () => {
      const request = {
        url: '/api/test',
        ip: '127.0.0.1',
        headers: { 'x-forwarded-for': '203.0.113.1, 198.51.100.1' },
      };
      mockContext = {
        switchToHttp: () => createHttpArgumentsHost(request),
      };

      // First request should pass
      await new Promise<void>((resolve, reject) => {
        interceptor
          .intercept(mockContext as ExecutionContext, mockNext)
          .subscribe({
            next: () => resolve(),
            error: (err) => reject(err),
          });
      });

      // Change IP in header but same extracted value
      request.headers['x-forwarded-for'] = '203.0.113.1, 198.51.100.2';

      await new Promise<void>((resolve, reject) => {
        interceptor
          .intercept(mockContext as ExecutionContext, mockNext)
          .subscribe({
            next: () => resolve(),
            error: (err) => reject(err),
          });
      });
    });

    it('blocks requests when RATE_LIMIT_MAX is 1', async () => {
      vi.spyOn(ConfigService.prototype, 'get').mockImplementation((key) => {
        if (key === 'RATE_LIMIT_MAX') return '1';
        if (key === 'RATE_LIMIT_STORE') return 'memory';
        return undefined;
      });

      const testConfigService = new ConfigService();
      const limitedInterceptor = new RateLimitInterceptor(testConfigService);

      const request = { url: '/api/test', ip: '127.0.0.1', headers: {} };
      mockContext = {
        switchToHttp: () => createHttpArgumentsHost(request),
      };

      // First request should succeed
      await new Promise<void>((resolve) => {
        limitedInterceptor
          .intercept(mockContext as ExecutionContext, mockNext)
          .subscribe({
            next: () => resolve(),
          });
      });

      // Second request should be blocked
      await expect(
        new Promise<void>((resolve, reject) => {
          limitedInterceptor
            .intercept(mockContext as ExecutionContext, mockNext)
            .subscribe({
              next: () => reject(new Error('Should have been blocked')),
              error: (e) => {
                if (e.getStatus() === 429) resolve();
                else reject(e instanceof Error ? e : new Error(String(e)));
              },
            });
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('includes retryAfter in 429 response', async () => {
      vi.spyOn(ConfigService.prototype, 'get').mockImplementation((key) => {
        if (key === 'RATE_LIMIT_MAX') return '1';
        if (key === 'RATE_LIMIT_STORE') return 'memory';
        return undefined;
      });

      const testConfigService = new ConfigService();
      const limitedInterceptor = new RateLimitInterceptor(testConfigService);

      const request = { url: '/api/test', ip: '127.0.0.1', headers: {} };
      mockContext = {
        switchToHttp: () => createHttpArgumentsHost(request),
      };

      // First request succeeds
      await new Promise<void>((resolve, reject) => {
        limitedInterceptor
          .intercept(mockContext as ExecutionContext, mockNext)
          .subscribe({
            next: () => resolve(),
            error: (err) => reject(err),
          });
      });

      // Second request should be blocked with retryAfter
      await new Promise<void>((resolve, reject) => {
        limitedInterceptor
          .intercept(mockContext as ExecutionContext, mockNext)
          .subscribe({
            next: () => reject(new Error('Should have been blocked')),
            error: (error) => {
              const response = error.getResponse();
              expect(response.retryAfter).toBeGreaterThan(0);
              expect(response.retryAfter).toBeLessThanOrEqual(60);
              resolve();
            },
          });
      });
    });
  });
});
