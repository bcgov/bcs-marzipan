import { ParseOptionalIntPipe } from './parse-optional-int.pipe';
import { BadRequestException } from '@nestjs/common';

describe('ParseOptionalIntPipe', () => {
  let pipe: ParseOptionalIntPipe;

  beforeEach(() => {
    pipe = new ParseOptionalIntPipe();
  });

  it('returns undefined for undefined', () => {
    expect(
      pipe.transform(undefined, { type: 'query', data: 'page' })
    ).toBeUndefined();
  });

  it('returns undefined for null', () => {
    expect(
      pipe.transform(null as unknown as string, { type: 'query', data: 'page' })
    ).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(pipe.transform('', { type: 'query', data: 'page' })).toBeUndefined();
  });

  it('parses "1" to 1', () => {
    expect(pipe.transform('1', { type: 'query', data: 'page' })).toBe(1);
  });

  it('throws BadRequestException for "x"', () => {
    expect(() => pipe.transform('x', { type: 'query', data: 'page' })).toThrow(
      BadRequestException
    );
    try {
      pipe.transform('x', { type: 'query', data: 'page' });
    } catch (e: unknown) {
      const res = (e as { getResponse: () => unknown }).getResponse();
      const msg =
        typeof res === 'object' && res !== null && 'message' in res
          ? String((res as { message: unknown }).message)
          : String(res);
      expect(msg).toContain('page');
      expect(msg).toMatch(/valid integer/);
    }
  });

  // Note: parseInt truncates floats - "1.5" becomes 1. This documents current behavior.
  it('parses "1.5" to 1 (parseInt truncates decimals)', () => {
    expect(pipe.transform('1.5', { type: 'query', data: 'page' })).toBe(1);
  });
});
