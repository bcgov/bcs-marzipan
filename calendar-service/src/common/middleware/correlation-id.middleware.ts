import { randomUUID } from 'crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/** UUID v4 pattern per RFC 4122: version 4, variant 10x */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuidV4(value: string): boolean {
  return typeof value === 'string' && UUID_V4_REGEX.test(value.trim());
}

/**
 * Correlation ID Middleware
 *
 * Generates or extracts a correlation ID for each request to enable
 * end-to-end request tracing across services and logs.
 *
 * - Checks for X-Correlation-ID header (for distributed tracing)
 * - Validates format (UUID v4); generates new ID if missing or invalid
 * - Attaches to request object for use in services/filters
 * - Returns in X-Correlation-ID response header
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const fromHeader = (req.headers['x-correlation-id'] as string) ?? '';
    const correlationId = isValidUuidV4(fromHeader)
      ? fromHeader.trim()
      : randomUUID();

    // Attach to request object for access in controllers/services/filters
    (req as Request & { correlationId: string }).correlationId = correlationId;

    // Set response header for client to receive correlation ID
    res.setHeader('X-Correlation-ID', correlationId);

    next();
  }
}
