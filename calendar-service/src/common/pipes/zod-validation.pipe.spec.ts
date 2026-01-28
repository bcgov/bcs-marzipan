import { ZodValidationPipe } from './zod-validation.pipe';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

const testSchema = z.object({
  name: z.string(),
  count: z.number().int().positive(),
});

describe('ZodValidationPipe', () => {
  let pipe: ZodValidationPipe;

  beforeEach(() => {
    pipe = new ZodValidationPipe(testSchema);
  });

  it('returns parsed value for valid input', () => {
    const input = { name: 'Test', count: 5 };
    const result = pipe.transform(input, { type: 'body', data: undefined });
    expect(result).toEqual(input);
  });

  it('throws BadRequestException with errors array for invalid input', () => {
    expect(() =>
      pipe.transform(
        { name: 'Test', count: -1 },
        { type: 'body', data: undefined }
      )
    ).toThrow(BadRequestException);

    try {
      pipe.transform(
        { name: 'Test', count: -1 },
        { type: 'body', data: undefined }
      );
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(BadRequestException);
      const res = (e as BadRequestException).getResponse() as {
        message: string;
        errors: Array<{ path: string; message: string; code: string }>;
      };
      expect(res).toHaveProperty('message', 'Validation failed');
      expect(res).toHaveProperty('errors');
      expect(Array.isArray(res.errors)).toBe(true);
      expect(res.errors.length).toBeGreaterThan(0);
      expect(res.errors[0]).toMatchObject({
        path: expect.any(String),
        message: expect.any(String),
        code: expect.any(String),
      });
    }
  });

  it('throws generic BadRequestException for non-ZodError', () => {
    const throwingSchema = z.any().transform(() => {
      throw new Error('Not a Zod error');
    });
    const p = new ZodValidationPipe(throwingSchema);
    expect(() => p.transform('x', { type: 'body', data: undefined })).toThrow(
      BadRequestException
    );
    try {
      p.transform('x', { type: 'body', data: undefined });
    } catch (e: unknown) {
      const res = (e as { getResponse: () => unknown }).getResponse();
      const msg =
        typeof res === 'object' && res !== null && 'message' in res
          ? (res as { message: unknown }).message
          : res;
      expect(msg).toBe('Validation failed');
    }
  });

  it('includes details in development', () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      try {
        pipe.transform(
          { name: 1, count: 1 },
          { type: 'body', data: undefined }
        );
      } catch (e: unknown) {
        const res = (e as BadRequestException).getResponse() as {
          details?: unknown;
        };
        expect(res).toHaveProperty('details');
        expect(Array.isArray(res.details)).toBe(true);
      }
    } finally {
      process.env.NODE_ENV = env;
    }
  });
});
