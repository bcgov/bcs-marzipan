/**
 * Log levels enum
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enableContext: boolean;
}

/**
 * Production-ready logger for the frontend application.
 * Supports different log levels and can be configured via environment variables.
 */
class Logger {
  private config: LoggerConfig;

  constructor(context?: string) {
    this.context = context;
    this.config = this.loadConfig();
  }

  private context?: string;

  /**
   * Load logger configuration from environment or defaults
   */
  private loadConfig(): LoggerConfig {
    const envLevel = import.meta.env.VITE_LOG_LEVEL?.toUpperCase();
    const isProduction = import.meta.env.PROD;

    let level: LogLevel;
    if (envLevel === 'DEBUG') level = LogLevel.DEBUG;
    else if (envLevel === 'INFO') level = LogLevel.INFO;
    else if (envLevel === 'WARN') level = LogLevel.WARN;
    else if (envLevel === 'ERROR') level = LogLevel.ERROR;
    else if (envLevel === 'NONE') level = LogLevel.NONE;
    else level = isProduction ? LogLevel.WARN : LogLevel.DEBUG;

    return {
      level,
      enableTimestamp: import.meta.env.VITE_LOG_TIMESTAMP !== 'false',
      enableContext: import.meta.env.VITE_LOG_CONTEXT !== 'false',
    };
  }

  /**
   * Format log message with context and timestamp
   */
  private formatMessage(level: string, message: string): string {
    const parts: string[] = [];

    if (this.config.enableTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    parts.push(`[${level}]`);

    if (this.config.enableContext && this.context) {
      parts.push(`[${this.context}]`);
    }

    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formattedMessage = this.formatMessage('ERROR', message);
      if (error instanceof Error) {
        console.error(formattedMessage, error, ...args);
      } else if (error) {
        console.error(formattedMessage, error, ...args);
      } else {
        console.error(formattedMessage, ...args);
      }
    }
  }
}

/**
 * Create a logger instance with optional context
 */
export function createLogger(context?: string): Logger {
  return new Logger(context);
}

/**
 * Default logger instance
 */
export const logger = createLogger();
