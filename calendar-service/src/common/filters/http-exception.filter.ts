import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { mapDatabaseError } from './database-error.mapper';

/**
 * Problem Details Response (RFC 7807)
 */
interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  correlationId: string;
  errors?: Array<{ path: string; message: string; code?: string }>;
  timestamp?: string;
  /** Only included in non-production responses */
  stack?: string;
}

/**
 * Global Exception Filter
 *
 * Catches all exceptions and formats them as RFC 7807 Problem Details.
 * Provides consistent error responses across the API with correlation IDs
 * for request tracing.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { correlationId?: string }>();

    const correlationId = request.correlationId || 'unknown';

    // Extract correlation ID from request (set by middleware)
    const problemDetails = this.buildProblemDetails(
      exception,
      request,
      correlationId
    );

    // Log error with correlation ID
    const logLevel = problemDetails.status >= 500 ? 'error' : 'warn';
    this.logger[logLevel](
      `[${correlationId}] ${problemDetails.title}: ${problemDetails.detail}`,
      exception instanceof Error ? exception.stack : undefined
    );

    // Set correlation ID header
    response.setHeader('X-Correlation-ID', correlationId);
    response.setHeader('Content-Type', 'application/problem+json');

    // Send Problem Details response
    response.status(problemDetails.status).json(problemDetails);
  }

  private buildProblemDetails(
    exception: unknown,
    request: Request,
    correlationId: string
  ): ProblemDetails {
    const path = request.url;

    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle validation errors from ZodValidationPipe
      if (
        status === Number(HttpStatus.BAD_REQUEST) &&
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'errors' in exceptionResponse
      ) {
        return {
          type: 'https://api.example.com/errors/validation',
          title: 'Validation Failed',
          status,
          detail:
            (exceptionResponse as { message?: string }).message ||
            'One or more validation errors occurred',
          instance: path,
          correlationId,
          errors: (exceptionResponse as { errors?: unknown[] }).errors as
            Array<{ path: string; message: string; code?: string }> | undefined,
          timestamp: new Date().toISOString(),
        };
      }

      // Handle other HTTP exceptions
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as { message?: string | string[] }).message ||
            'An error occurred';

      return {
        type: this.getErrorType(status),
        title: this.getErrorTitle(status),
        status,
        detail: Array.isArray(message) ? message.join(', ') : message,
        instance: path,
        correlationId,
        timestamp: new Date().toISOString(),
      };
    }

    // Handle database errors
    if (exception instanceof Error) {
      const dbError = mapDatabaseError(exception);
      if (dbError) {
        return {
          type: dbError.type,
          title: dbError.title,
          status: dbError.httpStatus,
          detail: dbError.detail,
          instance: path,
          correlationId,
          timestamp: new Date().toISOString(),
        };
      }

      // Handle other Error instances (e.g. wrapped DB errors with no code on outer error)
      const err = exception as Error & { cause?: Error };
      let detail: string;
      if (process.env.NODE_ENV === 'production') {
        detail = 'An unexpected error occurred';
      } else {
        detail = err.cause?.message ?? err.message;
      }
      return {
        type: 'https://api.example.com/errors/internal-server-error',
        title: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detail,
        instance: path,
        correlationId,
        ...(process.env.NODE_ENV !== 'production' && {
          stack: exception instanceof Error ? exception.stack : undefined,
        }),
        timestamp: new Date().toISOString(),
      };
    }

    // Handle unknown exceptions
    return {
      type: 'https://api.example.com/errors/internal-server-error',
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: 'An unexpected error occurred',
      instance: path,
      correlationId,
      timestamp: new Date().toISOString(),
    };
  }

  // TODO: Replace 'api.example.com' with actual domain when deploying to production
  private getErrorType(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'https://api.example.com/errors/bad-request',
      401: 'https://api.example.com/errors/unauthorized',
      403: 'https://api.example.com/errors/forbidden',
      404: 'https://api.example.com/errors/not-found',
      409: 'https://api.example.com/errors/conflict',
      429: 'https://api.example.com/errors/too-many-requests',
      500: 'https://api.example.com/errors/internal-server-error',
      503: 'https://api.example.com/errors/service-unavailable',
    };

    return statusMap[status] || 'https://api.example.com/errors/error';
  }

  private getErrorTitle(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      503: 'Service Unavailable',
    };

    return statusMap[status] || 'Error';
  }
}
