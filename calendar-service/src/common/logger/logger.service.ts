import { Injectable, Logger } from '@nestjs/common';

/**
 * Application logger service that wraps NestJS Logger.
 * Provides consistent logging interface across the application.
 */
@Injectable()
export class AppLogger extends Logger {
  /**
   * Log a debug message
   */
  debug(message: string, context?: string): void {
    if (process.env.NODE_ENV !== 'production') {
      super.debug(message, context);
    }
  }

  /**
   * Log an info message
   */
  log(message: string, context?: string): void {
    super.log(message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string): void {
    super.warn(message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, trace?: string, context?: string): void {
    super.error(message, trace, context);
  }

  /**
   * Log a verbose message
   */
  verbose(message: string, context?: string): void {
    if (process.env.NODE_ENV !== 'production') {
      super.verbose(message, context);
    }
  }
}
