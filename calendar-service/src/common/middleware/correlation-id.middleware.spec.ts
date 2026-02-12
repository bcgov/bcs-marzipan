import type { NextFunction, Request, Response } from 'express';

import { CorrelationIdMiddleware } from './correlation-id.middleware';

/** UUID v4 pattern per RFC 4122 - same as in middleware */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuidV4(value: string): boolean {
  return typeof value === 'string' && UUID_V4_REGEX.test(value.trim());
}

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  let mockRequest: Partial<Request & { correlationId?: string }>;
  let mockResponse: Partial<Response>;
  let setHeaderSpy: ReturnType<typeof vi.fn>;
  let nextSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
    mockRequest = { headers: {} };
    setHeaderSpy = vi.fn();
    mockResponse = { setHeader: setHeaderSpy } as Partial<Response>;
    nextSpy = vi.fn();
  });

  it('generates UUID v4 and sets it on request and response when no header', () => {
    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextSpy as NextFunction
    );

    expect(mockRequest.correlationId).toBeDefined();
    expect(isValidUuidV4(mockRequest.correlationId as string)).toBe(true);
    expect(setHeaderSpy).toHaveBeenCalledWith(
      'X-Correlation-ID',
      mockRequest.correlationId
    );
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });

  it('uses header value when valid UUID v4 and passes to setHeader and next', () => {
    const validUuid = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
    mockRequest.headers = { 'x-correlation-id': validUuid };

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextSpy as NextFunction
    );

    expect(mockRequest.correlationId).toBe(validUuid);
    expect(setHeaderSpy).toHaveBeenCalledWith('X-Correlation-ID', validUuid);
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });

  it('generates new UUID when header is invalid or empty and calls next once', () => {
    mockRequest.headers = { 'x-correlation-id': 'not-a-uuid' };

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextSpy as NextFunction
    );

    expect(mockRequest.correlationId).toBeDefined();
    expect(isValidUuidV4(mockRequest.correlationId as string)).toBe(true);
    expect(mockRequest.correlationId).not.toBe('not-a-uuid');
    expect(setHeaderSpy).toHaveBeenCalledWith(
      'X-Correlation-ID',
      mockRequest.correlationId
    );
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });

  it('generates new UUID when header is empty string', () => {
    mockRequest.headers = { 'x-correlation-id': '' };

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextSpy as NextFunction
    );

    expect(mockRequest.correlationId).toBeDefined();
    expect(isValidUuidV4(mockRequest.correlationId as string)).toBe(true);
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });
});
