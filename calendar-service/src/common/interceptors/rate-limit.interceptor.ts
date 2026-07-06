import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  get(key: string): RateLimitEntry | undefined;
  set(key: string, value: RateLimitEntry): void;
  delete(key: string): void;
  keys(): string[];
}

class InMemoryRateLimitStore implements RateLimitStore {
  private readonly store: Record<string, RateLimitEntry> = {};

  get(key: string): RateLimitEntry | undefined {
    return this.store[key];
  }

  set(key: string, value: RateLimitEntry): void {
    this.store[key] = value;
  }

  delete(key: string): void {
    delete this.store[key];
  }

  keys(): string[] {
    return Object.keys(this.store);
  }
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly store: RateLimitStore;
  private readonly maxRequests: number;
  private readonly windowMs: number = 60000; // 1 minute

  constructor(private readonly configService: ConfigService) {
    this.store = new InMemoryRateLimitStore();

    // Get max requests from config, default to 100 per minute
    this.maxRequests =
      parseInt(this.configService.get<string>('RATE_LIMIT_MAX') || '100', 10) ||
      100;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // TODO: Properly type the request object from ExecutionContext
    // NestJS ExecutionContext.getRequest() returns 'any' by default
    // Consider creating a typed interface or using NestJS Request type from @nestjs/common
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    // Skip rate limiting for health and readiness endpoints
    if (url === '/health' || url === '/ready') {
      return next.handle();
    }

    const ip = this.getClientIp(
      request as Parameters<typeof this.getClientIp>[0]
    );
    const now = Date.now();

    // Clean up expired entries
    this.cleanup(now);

    // Get or create rate limit entry for this IP
    const entry = this.store.get(ip) || {
      count: 0,
      resetTime: now + this.windowMs,
    };

    // Check if window has expired
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.windowMs;
    }

    // Increment count
    entry.count++;

    // Store updated entry
    this.store.set(ip, entry);

    // Check if limit exceeded
    if (entry.count > this.maxRequests) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return next.handle();
  }

  private getClientIp(request: {
    headers?: Record<string, string | string[] | undefined>;
    ip?: string;
    connection?: { remoteAddress?: string };
  }): string {
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

  private cleanup(now: number): void {
    // Remove entries that have expired (older than 2 minutes to be safe)
    const expireTime = now - this.windowMs * 2;
    this.store.keys().forEach((ip) => {
      const entry = this.store.get(ip);
      if (entry && entry.resetTime < expireTime) {
        this.store.delete(ip);
      }
    });
  }
}
