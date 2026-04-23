import { BadRequestException } from '@nestjs/common';

import { ParsePositiveIntPipe } from './parse-positive-int.pipe';

describe('ParsePositiveIntPipe', () => {
  let pipe: ParsePositiveIntPipe;

  beforeEach(() => {
    pipe = new ParsePositiveIntPipe();
  });

  it('parses "1" to 1', () => {
    expect(pipe.transform('1', { type: 'param', data: 'id' })).toBe(1);
  });

  it('parses "42" to 42', () => {
    expect(pipe.transform('42', { type: 'param', data: 'id' })).toBe(42);
  });

  it('throws BadRequestException for "0"', () => {
    expect(() => pipe.transform('0', { type: 'param', data: 'page' })).toThrow(
      BadRequestException
    );
    try {
      pipe.transform('0', { type: 'param', data: 'page' });
    } catch (e: unknown) {
      const res = (e as { getResponse: () => unknown }).getResponse();
      const msg =
        typeof res === 'object' && res !== null && 'message' in res
          ? String(res.message)
          : String(res);
      expect(msg).toContain('page');
      expect(msg).toMatch(/positive integer/);
    }
  });

  it('throws BadRequestException for "-1"', () => {
    expect(() => pipe.transform('-1', { type: 'param', data: 'id' })).toThrow(
      BadRequestException
    );
  });

  it('throws BadRequestException for "x"', () => {
    expect(() => pipe.transform('x', { type: 'param', data: 'id' })).toThrow(
      BadRequestException
    );
  });

  it('throws BadRequestException for empty string', () => {
    expect(() => pipe.transform('', { type: 'param', data: 'id' })).toThrow(
      BadRequestException
    );
  });

  it('message includes metadata.data', () => {
    try {
      pipe.transform('x', { type: 'param', data: 'page' });
    } catch (e: unknown) {
      const res = (e as { getResponse: () => unknown }).getResponse();
      const msg =
        typeof res === 'object' && res !== null && 'message' in res
          ? String(res.message)
          : String(res);
      expect(msg).toContain('page');
    }
  });

  // Note: parseInt truncates floats - "1.5" becomes 1. This documents current behavior.
  it('parses "1.5" to 1 (parseInt truncates decimals)', () => {
    expect(pipe.transform('1.5', { type: 'param', data: 'id' })).toBe(1);
  });
});
