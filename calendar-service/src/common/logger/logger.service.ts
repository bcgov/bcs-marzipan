import { Injectable, Logger } from '@nestjs/common';

/**
 * Application logger service that wraps NestJS Logger.
 * Provides consistent logging interface across the application with correlation ID support.
 */
@Injectable()
export class AppLogger extends Logger {
  /**
   * Format message with correlation ID if provided
   */
  private formatMessage(message: string, correlationId?: string): string {
    if (correlationId && correlationId !== 'unknown') {
      return `[${correlationId}] ${message}`;
    }
    return message;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: string, correlationId?: string): void {
    if (process.env.NODE_ENV !== 'production') {
      super.debug(this.formatMessage(message, correlationId), context);
    }
  }

  /**
   * Log an info message
   */
  log(message: string, context?: string, correlationId?: string): void {
    super.log(this.formatMessage(message, correlationId), context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string, correlationId?: string): void {
    super.warn(this.formatMessage(message, correlationId), context);
  }

  /**
   * Log an error message
   */
  error(
    message: string,
    trace?: string,
    context?: string,
    correlationId?: string
  ): void {
    super.error(this.formatMessage(message, correlationId), trace, context);
  }

  /**
   * Log a verbose message
   */
  verbose(message: string, context?: string, correlationId?: string): void {
    if (process.env.NODE_ENV !== 'production') {
      super.verbose(this.formatMessage(message, correlationId), context);
    }
  }
}
