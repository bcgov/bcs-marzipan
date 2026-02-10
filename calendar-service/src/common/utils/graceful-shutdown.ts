import { INestApplication } from '@nestjs/common';

import { AppLogger } from '../logger/logger.service';

const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10000;

/**
 * Sets up graceful shutdown handling for a NestJS application.
 * Listens for SIGTERM and SIGINT signals and performs a clean shutdown.
 * Includes a forced exit timeout as a safety net.
 *
 * @param app - The NestJS application instance
 * @param logger - The application logger
 * @param timeoutMs - Forced shutdown timeout in milliseconds (default: 10000)
 */
export function setupGracefulShutdown(
  app: INestApplication,
  logger: AppLogger,
  timeoutMs: number = DEFAULT_SHUTDOWN_TIMEOUT_MS
): void {
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, starting graceful shutdown...`);

    // Stop accepting new requests
    const server = app.getHttpServer();
    server.close(() => {
      logger.log('HTTP server closed');
    });

    // Force exit after timeout
    const timeout = setTimeout(() => {
      logger.warn('Forced shutdown after timeout');
      process.exit(1);
    }, timeoutMs);

    try {
      // Close NestJS application (handles cleanup of providers, including database)
      await app.close();
      clearTimeout(timeout);
      logger.log('Application closed gracefully');
      process.exit(0);
    } catch (error) {
      clearTimeout(timeout);
      logger.error(
        'Error during shutdown',
        error instanceof Error ? error.stack : String(error)
      );
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => {
    shutdown('SIGTERM').catch((error) => {
      logger.error('Unexpected error during SIGTERM shutdown', String(error));
      process.exit(1);
    });
  });

  process.on('SIGINT', () => {
    shutdown('SIGINT').catch((error) => {
      logger.error('Unexpected error during SIGINT shutdown', String(error));
      process.exit(1);
    });
  });
}
