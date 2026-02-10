import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  createArrayResponseWrapperSchema,
  createResponseWrapperSchema,
} from './response-wrapper.schema';

describe('createResponseWrapperSchema', () => {
  const dataSchema = z.object({ id: z.number(), name: z.string() });
  const wrapperSchema = createResponseWrapperSchema(dataSchema);

  it('accepts valid { success: true, data }', () => {
    const input = { success: true as const, data: { id: 1, name: 'Test' } };
    const result = wrapperSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('rejects success: false', () => {
    expect(() =>
      wrapperSchema.parse({ success: false, data: { id: 1, name: 'Test' } })
    ).toThrow();
  });

  it('rejects missing data', () => {
    expect(() => wrapperSchema.parse({ success: true })).toThrow();
  });

  it('rejects wrong data shape', () => {
    expect(() =>
      wrapperSchema.parse({ success: true, data: { id: 'x', name: 123 } })
    ).toThrow();
  });

  it('rejects wrong data shape (missing required field)', () => {
    expect(() =>
      wrapperSchema.parse({ success: true, data: { id: 1 } })
    ).toThrow(); // name is required
  });
});

describe('createArrayResponseWrapperSchema', () => {
  const itemSchema = z.object({ id: z.number() });
  const arrayWrapperSchema = createArrayResponseWrapperSchema(itemSchema);

  it('accepts valid { success: true, data: [] }', () => {
    const input = { success: true as const, data: [] };
    const result = arrayWrapperSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('accepts valid { success: true, data: [items] }', () => {
    const input = { success: true as const, data: [{ id: 1 }, { id: 2 }] };
    const result = arrayWrapperSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('rejects success: false', () => {
    expect(() =>
      arrayWrapperSchema.parse({ success: false, data: [] })
    ).toThrow();
  });

  it('rejects missing data', () => {
    expect(() => arrayWrapperSchema.parse({ success: true })).toThrow();
  });

  it('rejects wrong item shape in array', () => {
    expect(() =>
      arrayWrapperSchema.parse({ success: true, data: [{ id: 'x' }] })
    ).toThrow();
  });
});
