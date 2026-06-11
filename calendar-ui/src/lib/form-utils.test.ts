import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  formatMissingRequiredFieldsCountMessage,
  getMissingRequiredFieldItems,
  getMissingRequiredFieldItemsFromZodError,
  getMissingRequiredFields,
  getMissingRequiredFieldsFromZodError,
} from './form-utils';

describe('formatMissingRequiredFieldsCountMessage', () => {
  it('returns null when count is zero', () => {
    expect(formatMissingRequiredFieldsCountMessage(0)).toBeNull();
  });

  it('uses singular copy for one field', () => {
    expect(formatMissingRequiredFieldsCountMessage(1)).toBe(
      '1 more required field'
    );
  });

  it('uses plural copy for multiple fields', () => {
    expect(formatMissingRequiredFieldsCountMessage(4)).toBe(
      '4 more required fields'
    );
  });
});

describe('getMissingRequiredFields', () => {
  it('extracts top-level field labels from nested errors', () => {
    const missing = getMissingRequiredFields(
      {
        errors: {
          title: { type: 'too_small', message: 'Required' },
          categoryIds: { type: 'too_small', message: 'At least one category' },
        },
      } as never,
      (field) => `Label:${field}`
    );

    expect(missing).toEqual(['Label:title', 'Label:categoryIds']);
  });
});

describe('getMissingRequiredFieldsFromZodError', () => {
  it('dedupes issues by top-level field path', () => {
    const schema = z.object({
      title: z.string().min(1),
      categoryIds: z.array(z.number()).min(1),
    });

    const result = schema.safeParse({ title: '', categoryIds: [] });
    expect(result.success).toBe(false);
    if (result.success) return;

    const missing = getMissingRequiredFieldsFromZodError(
      result.error,
      (field) => `Label:${field}`
    );

    expect(missing).toEqual(['Label:title', 'Label:categoryIds']);
  });
});

describe('getMissingRequiredFieldItemsFromZodError', () => {
  it('returns field names and labels while deduping top-level paths', () => {
    const schema = z.object({
      title: z.string().min(1),
      categoryIds: z.array(z.number()).min(1),
    });

    const result = schema.safeParse({ title: '', categoryIds: [] });
    expect(result.success).toBe(false);
    if (result.success) return;

    const missing = getMissingRequiredFieldItemsFromZodError(
      result.error,
      (field) => `Label:${field}`
    );

    expect(missing).toEqual([
      { name: 'title', label: 'Label:title' },
      { name: 'categoryIds', label: 'Label:categoryIds' },
    ]);
  });
});

describe('getMissingRequiredFieldItems', () => {
  it('extracts top-level field names and labels from nested errors', () => {
    const missing = getMissingRequiredFieldItems(
      {
        errors: {
          title: { type: 'too_small', message: 'Required' },
          categoryIds: { type: 'too_small', message: 'At least one category' },
        },
      } as never,
      (field) => `Label:${field}`
    );

    expect(missing).toEqual([
      { name: 'title', label: 'Label:title' },
      { name: 'categoryIds', label: 'Label:categoryIds' },
    ]);
  });
});
