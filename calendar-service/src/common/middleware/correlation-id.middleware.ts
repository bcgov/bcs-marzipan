import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Correlation ID Middleware
 *
 * Generates or extracts a correlation ID for each request to enable
 * end-to-end request tracing across services and logs.
 *
 * - Checks for X-Correlation-ID header (for distributed tracing)
 * - Generates UUID if not present
 * - Attaches to request object for use in services/filters
 * - Returns in X-Correlation-ID response header
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Extract existing correlation ID from header, or generate new one
    const correlationId =
      (req.headers['x-correlation-id'] as string) || randomUUID();

    // Attach to request object for access in controllers/services/filters
    (req as Request & { correlationId: string }).correlationId = correlationId;

    // Set response header for client to receive correlation ID
    res.setHeader('X-Correlation-ID', correlationId);

    next();
  }
}
