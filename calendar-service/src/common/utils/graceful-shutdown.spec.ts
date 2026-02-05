/**
 * Unit tests for graceful shutdown. ESLint unbound-method is disabled here
 * because we assert on spy functions (expect(spy).toHaveBeenCalledWith);
 * the rule flags those when the same reference is assigned to object properties.
 */

import { setupGracefulShutdown } from './graceful-shutdown';
import type { INestApplication } from '@nestjs/common';
import type { AppLogger } from '../logger/logger.service';

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('setupGracefulShutdown', () => {
  let mockApp: INestApplication;
  let mockServer: { close: ReturnType<typeof vi.fn> };
  let mockLogger: AppLogger;
  let serverCloseSpy: ReturnType<typeof vi.fn>;
  let appCloseSpy: ReturnType<typeof vi.fn>;
  let logSpy: ReturnType<typeof vi.fn>;
  let warnSpy: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.fn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    serverCloseSpy = vi.fn((cb?: () => void) => {
      if (typeof cb === 'function') cb();
    });
    mockServer = { close: serverCloseSpy };
    appCloseSpy = vi.fn().mockResolvedValue(undefined);
    mockApp = {
      getHttpServer: () => mockServer,
      close: appCloseSpy,
    } as unknown as INestApplication;
    logSpy = vi.fn();
    warnSpy = vi.fn();
    errorSpy = vi.fn();
    mockLogger = {
      log: logSpy,
      warn: warnSpy,
      error: errorSpy,
    } as unknown as AppLogger;
    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as (
        code?: number | string | null
      ) => never);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
    vi.useRealTimers();
  });

  describe('SIGTERM', () => {
    it('calls server.close, app.close, logs and exits 0', async () => {
      setupGracefulShutdown(mockApp, mockLogger);
      process.emit('SIGTERM');
      await flushPromises();

      expect(serverCloseSpy).toHaveBeenCalled();
      expect(appCloseSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        'Received SIGTERM, starting graceful shutdown...'
      );
      expect(logSpy).toHaveBeenCalledWith('Application closed gracefully');
      expect(exitSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('SIGINT', () => {
    it('calls server.close, app.close, logs and exits 0', async () => {
      setupGracefulShutdown(mockApp, mockLogger);
      process.emit('SIGINT');
      await flushPromises();

      expect(serverCloseSpy).toHaveBeenCalled();
      expect(appCloseSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        'Received SIGINT, starting graceful shutdown...'
      );
      expect(logSpy).toHaveBeenCalledWith('Application closed gracefully');
      expect(exitSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('forced timeout', () => {
    it('logs forced shutdown and exits 1 when app.close never resolves', async () => {
      appCloseSpy.mockReturnValue(new Promise(() => {}));
      vi.useFakeTimers();
      setupGracefulShutdown(mockApp, mockLogger, 10000);
      process.emit('SIGTERM');
      await vi.advanceTimersByTimeAsync(10000);

      expect(warnSpy).toHaveBeenCalledWith('Forced shutdown after timeout');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('shutdown error', () => {
    it('logs error and exits 1 when app.close rejects', async () => {
      const shutdownError = new Error('Close failed');
      appCloseSpy.mockRejectedValue(shutdownError);
      setupGracefulShutdown(mockApp, mockLogger);
      process.emit('SIGTERM');
      await flushPromises();

      expect(errorSpy).toHaveBeenCalledWith(
        'Error during shutdown',
        shutdownError.stack
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
