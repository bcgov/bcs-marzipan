/**
 * Rate Limit Interceptor
 *
 * This is the single global rate-limiting layer for calendar-service.
 *
 * - General endpoints: RATE_LIMIT_MAX requests per minute per IP (default: 100)
 * - Sensitive auth endpoints: RATE_LIMIT_AUTH_MAX requests per minute per IP (default: 5)
 * - Store backend: RATE_LIMIT_STORE=memory|redis (default: memory)
 */

import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { defer, from, Observable, switchMap } from 'rxjs';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RequestLike {
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  connection?: { remoteAddress?: string };
}

interface RateLimitStore {
  increment(
    key: string,
    windowMs: number,
    now: number
  ): Promise<RateLimitEntry>;
  cleanup(now: number, windowMs: number): Promise<void>;
}

class InMemoryRateLimitStore implements RateLimitStore {
  private readonly store: Record<string, RateLimitEntry> = {};

  increment(
    key: string,
    windowMs: number,
    now: number
  ): Promise<RateLimitEntry> {
    const entry = this.store[key] || {
      count: 0,
      resetTime: now + windowMs,
    };

    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
    }

    entry.count++;
    this.store[key] = entry;

    return Promise.resolve(entry);
  }

  cleanup(now: number, windowMs: number): Promise<void> {
    const expireTime = now - windowMs * 2;
    Object.keys(this.store).forEach((key) => {
      const entry = this.store[key];
      if (entry.resetTime < expireTime) {
        delete this.store[key];
      }
    });

    return Promise.resolve();
  }
}

interface RedisClientLike {
  connect(): Promise<void>;
  on(event: 'error', listener: (error: unknown) => void): void;
  incr(key: string): Promise<number>;
  pExpire(key: string, milliseconds: number): Promise<number>;
  pTTL(key: string): Promise<number>;
}

class RedisRateLimitStore implements RateLimitStore {
  private readonly fallbackStore = new InMemoryRateLimitStore();
  private client: RedisClientLike | null = null;
  private connectPromise: Promise<void> | null = null;
  private hasLoggedFallback = false;

  constructor(
    private readonly redisUrl: string,
    private readonly logger: Logger
  ) {}

  async increment(
    key: string,
    windowMs: number,
    now: number
  ): Promise<RateLimitEntry> {
    try {
      const client = await this.getConnectedClient();

      const count = await client.incr(key);
      if (count === 1) {
        await client.pExpire(key, windowMs);
      }

      let ttl = await client.pTTL(key);
      if (ttl < 0) {
        await client.pExpire(key, windowMs);
        ttl = windowMs;
      }
      const effectiveTtl = ttl;
      return {
        count,
        resetTime: now + effectiveTtl,
      };
    } catch (error) {
      if (!this.hasLoggedFallback) {
        this.logger.warn(
          `Redis rate-limit store unavailable, falling back to in-memory store: ${error instanceof Error ? error.message : String(error)}`
        );
        this.hasLoggedFallback = true;
      }

      return this.fallbackStore.increment(key, windowMs, now);
    }
  }

  async cleanup(now: number, windowMs: number): Promise<void> {
    // Redis keys self-expire; this keeps fallback memory store tidy.
    await this.fallbackStore.cleanup(now, windowMs);
  }

  private async getConnectedClient(): Promise<RedisClientLike> {
    if (!this.client) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const redis = require('redis') as {
        createClient(options: { url: string }): RedisClientLike;
      };

      this.client = redis.createClient({ url: this.redisUrl });
      this.client.on('error', (error) => {
        this.logger.warn(
          `Redis client error in rate-limit store: ${error instanceof Error ? error.message : String(error)}`
        );
      });
      this.connectPromise = this.client.connect();
    }

    if (this.connectPromise) {
      try {
        await this.connectPromise;
      } catch (error) {
        this.client = null;
        this.connectPromise = null;
        throw error;
      }
    }

    return this.client;
  }
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitInterceptor.name);
  private readonly store: RateLimitStore;
  private readonly maxRequests: number;
  private readonly authMaxRequests: number;
  private readonly windowMs: number = 60000; // 1 minute

  constructor(private readonly configService: ConfigService) {
    // Get max requests from config, default to 100 per minute
    this.maxRequests =
      parseInt(this.configService.get<string>('RATE_LIMIT_MAX') || '100', 10) ||
      100;
    this.authMaxRequests =
      parseInt(
        this.configService.get<string>('RATE_LIMIT_AUTH_MAX') || '5',
        10
      ) || 5;

    const configuredStoreType =
      this.configService.get<string>('RATE_LIMIT_STORE', 'memory') || 'memory';
    const storeType = configuredStoreType.toLowerCase();

    if (storeType === 'redis') {
      const redisUrl =
        this.configService.get<string>('RATE_LIMIT_REDIS_URL') ||
        this.configService.get<string>('REDIS_URL');

      if (redisUrl) {
        this.store = new RedisRateLimitStore(redisUrl, this.logger);
      } else {
        this.logger.warn(
          'RATE_LIMIT_STORE=redis but no RATE_LIMIT_REDIS_URL/REDIS_URL configured; using in-memory rate-limit store'
        );
        this.store = new InMemoryRateLimitStore();
      }
    } else {
      this.store = new InMemoryRateLimitStore();
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // TODO: Properly type the request object from ExecutionContext
    // NestJS ExecutionContext.getRequest() returns 'any' by default
    // Consider creating a typed interface or using NestJS Request type from @nestjs/common
    const request = context.switchToHttp().getRequest<RequestLike>();
    return defer(() => from(this.enforceRateLimit(request))).pipe(
      switchMap(() => next.handle())
    );
  }

  private getClientIp(request: RequestLike): string {
    // Try to get IP from various headers (for proxies/load balancers)
    const forwarded = request.headers?.['x-forwarded-for'];
    if (forwarded) {
      const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      if (forwardedStr) {
        return forwardedStr.split(',')[0].trim();
      }
    }

    const realIp = request.headers?.['x-real-ip'];
    if (realIp) {
      const realIpStr = Array.isArray(realIp) ? realIp[0] : realIp;
      if (realIpStr) {
        return realIpStr;
      }
    }

    // Try request.ip (Express)
    if (request.ip) {
      return request.ip;
    }

    // Try connection.remoteAddress
    if (request.connection?.remoteAddress) {
      return request.connection.remoteAddress;
    }

    // Fallback to a default if IP cannot be determined
    return 'unknown';
  }

  private async enforceRateLimit(request: RequestLike): Promise<void> {
    const rawUrl = request.url;
    const url = rawUrl?.split('?')[0] ?? '';
    if (url === '/health' || url === '/ready') {
      return;
    }

    const maxRequests = this.getMaxRequestsForUrl(url);
    const ip = this.getClientIp(request);
    const now = Date.now();
    const key = `ip:${ip}:limit:${maxRequests}`;

    await this.store.cleanup(now, this.windowMs);
    const entry = await this.store.increment(key, this.windowMs, now);

    if (entry.count > maxRequests) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  private getMaxRequestsForUrl(url: string): number {
    switch (url) {
      case '/auth/login':
      case '/auth/check-email':
      case '/auth/set-password':
      case '/auth/verify-reset-code':
      case '/auth/change-password':
        return this.authMaxRequests;
      default:
        return this.maxRequests;
    }
  }
}
