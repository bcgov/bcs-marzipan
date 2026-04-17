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
      const formatted = this.formatMessage(message, correlationId);
      if (context !== undefined) {
        super.debug(formatted, context);
      } else {
        super.debug(formatted);
      }
    }
  }

  /**
   * Log an info message
   */
  log(message: string, context?: string, correlationId?: string): void {
    const formatted = this.formatMessage(message, correlationId);
    if (context !== undefined) {
      super.log(formatted, context);
    } else {
      super.log(formatted);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string, correlationId?: string): void {
    const formatted = this.formatMessage(message, correlationId);
    if (context !== undefined) {
      super.warn(formatted, context);
    } else {
      super.warn(formatted);
    }
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
    const formatted = this.formatMessage(message, correlationId);
    if (trace !== undefined) {
      if (context !== undefined) {
        super.error(formatted, trace, context);
      } else {
        super.error(formatted, trace);
      }
    } else if (context !== undefined) {
      super.error(formatted, context);
    } else {
      super.error(formatted);
    }
  }

  /**
   * Log a verbose message
   */
  verbose(message: string, context?: string, correlationId?: string): void {
    if (process.env.NODE_ENV !== 'production') {
      const formatted = this.formatMessage(message, correlationId);
      if (context !== undefined) {
        super.verbose(formatted, context);
      } else {
        super.verbose(formatted);
      }
    }
  }
}
