import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import type {
  ArgumentsHost,
  HttpArgumentsHost,
} from '@nestjs/common/interfaces';
import type { Request, Response } from 'express';

import { HttpExceptionFilter } from './http-exception.filter';

function createMockHost(
  request: Partial<Request & { correlationId?: string }>,
  response: Partial<Response>
): ArgumentsHost {
  const httpArgumentsHost: HttpArgumentsHost = {
    getRequest: () => request,
    getResponse: () => response,
    getNext: () => undefined,
  } as HttpArgumentsHost;

  return {
    switchToHttp: () => httpArgumentsHost,
  } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockRequest: Partial<Request & { correlationId?: string }>;
  let mockResponse: Partial<Response>;
  let setHeaderSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;
  let jsonSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    filter = new HttpExceptionFilter();
    setHeaderSpy = vi.fn();
    statusSpy = vi.fn().mockReturnThis();
    jsonSpy = vi.fn();
    mockRequest = { url: '/test/path' };
    mockResponse = {
      setHeader: setHeaderSpy,
      status: statusSpy,
      json: jsonSpy,
    } as Partial<Response>;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validation (400 with errors)', () => {
    it('returns Problem Details with errors array for BadRequestException with errors', () => {
      const exception = new BadRequestException({
        message: 'Validation failed',
        errors: [{ path: 'title', message: 'Required', code: 'invalid_type' }],
      });
      const host = createMockHost(mockRequest, mockResponse);

      filter.catch(exception, host);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'X-Correlation-ID',
        expect.any(String)
      );
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Content-Type',
        'application/problem+json'
      );
      const body = jsonSpy.mock.calls[0][0];
      expect(body).toMatchObject({
        type: 'https://api.example.com/errors/validation',
        title: 'Validation Failed',
        status: 400,
        detail: 'Validation failed',
        instance: '/test/path',
        correlationId: expect.any(String),
        timestamp: expect.any(String),
      });
      expect(Array.isArray(body.errors)).toBe(true);
      expect(body.errors.length).toBeGreaterThan(0);
      expect(body.errors[0]).toMatchObject({
        path: 'title',
        message: 'Required',
        code: 'invalid_type',
      });
    });
  });

  describe('HttpException (e.g. 404)', () => {
    it('returns Problem Details shape without errors array for NotFoundException', () => {
      const exception = new NotFoundException('Activity #123 not found');
      const host = createMockHost(mockRequest, mockResponse);

      filter.catch(exception, host);

      expect(statusSpy).toHaveBeenCalledWith(404);
      const body = jsonSpy.mock.calls[0][0];
      expect(body).toMatchObject({
        type: 'https://api.example.com/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Activity #123 not found',
        instance: '/test/path',
        correlationId: expect.any(String),
        timestamp: expect.any(String),
      });
      expect(body.errors).toBeUndefined();
    });
  });

  describe('database-mapped error', () => {
    it('returns 409 and mapper output for Error with code 23505', () => {
      const exception = Object.assign(new Error('Unique violation'), {
        code: '23505',
      });
      const host = createMockHost(mockRequest, mockResponse);

      filter.catch(exception, host);

      expect(statusSpy).toHaveBeenCalledWith(409);
      const body = jsonSpy.mock.calls[0][0];
      expect(body).toMatchObject({
        type: 'https://api.example.com/errors/conflict',
        title: 'Conflict',
        status: 409,
        detail: 'A record with this value already exists',
        instance: '/test/path',
        correlationId: expect.any(String),
        timestamp: expect.any(String),
      });
    });
  });

  describe('generic Error (500)', () => {
    it('returns 500 with Internal Server Error title and non-empty detail', () => {
      const exception = new Error('Something broke');
      const host = createMockHost(mockRequest, mockResponse);

      filter.catch(exception, host);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Content-Type',
        'application/problem+json'
      );
      const body = jsonSpy.mock.calls[0][0];
      expect(body.title).toBe('Internal Server Error');
      expect(typeof body.detail).toBe('string');
      expect(body.detail.length).toBeGreaterThan(0);
      expect(body).toMatchObject({
        type: 'https://api.example.com/errors/internal-server-error',
        status: 500,
        instance: '/test/path',
        correlationId: expect.any(String),
        timestamp: expect.any(String),
      });
    });
  });

  describe('correlation ID propagation', () => {
    it('uses request.correlationId when set and passes to header and body', () => {
      const requestWithId = {
        ...mockRequest,
        correlationId: 'fixed-id',
      };
      const exception = new NotFoundException('Not found');
      const host = createMockHost(requestWithId, mockResponse);

      filter.catch(exception, host);

      expect(setHeaderSpy).toHaveBeenCalledWith('X-Correlation-ID', 'fixed-id');
      const body = jsonSpy.mock.calls[0][0];
      expect(body.correlationId).toBe('fixed-id');
    });

    it('uses "unknown" when request has no correlationId', () => {
      const exception = new NotFoundException('Not found');
      const host = createMockHost(mockRequest, mockResponse);

      filter.catch(exception, host);

      expect(setHeaderSpy).toHaveBeenCalledWith('X-Correlation-ID', 'unknown');
      const body = jsonSpy.mock.calls[0][0];
      expect(body.correlationId).toBe('unknown');
    });
  });
});
