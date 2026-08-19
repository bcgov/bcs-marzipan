import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { createActivityRequestSchema } from '@corpcal/shared/schemas';

import {
  focusFirstMissingRequiredField,
  focusRequiredField,
  formatMissingRequiredFieldsCountMessage,
  getMissingRequiredFieldItems,
  getMissingRequiredFieldItemsFromZodError,
  getMissingRequiredFields,
  getMissingRequiredFieldsFromZodError,
} from './form-utils';

function minimalCreateRequest(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Test Activity',
    summary: 'Summary',
    dateStatusId: 1,
    timeStatusId: 1,
    leadTeamId: 1,
    leadMinistryId: 1,
    categoryIds: [1],
    commsContacts: [{ userId: 1, isLead: true }],
    ...overrides,
  };
}

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

describe('focusRequiredField', () => {
  it('scrolls and focuses a control matched by data-field', () => {
    const container = document.createElement('div');
    container.dataset.field = 'title';
    const input = document.createElement('input');
    container.append(input);
    document.body.append(container);

    const scrollSpy = vi.spyOn(container, 'scrollIntoView');
    const focusSpy = vi.spyOn(input, 'focus');

    expect(focusRequiredField('title')).toBe(true);

    expect(scrollSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

    container.remove();
  });

  it('uses the first missing field with a matching element', () => {
    const input = document.createElement('input');
    input.name = 'summary';
    document.body.append(input);

    const scrollSpy = vi.spyOn(input, 'scrollIntoView');

    expect(
      focusFirstMissingRequiredField([
        { name: 'title', label: 'Title' },
        { name: 'summary', label: 'Summary' },
      ])
    ).toBe(true);
    expect(scrollSpy).toHaveBeenCalled();

    input.remove();
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
  it('excludes max-length failures from the missing-fields hint', () => {
    const result = createActivityRequestSchema.safeParse(
      minimalCreateRequest({ title: 'a'.repeat(256) })
    );
    expect(result.success).toBe(false);
    if (result.success) return;

    const missing = getMissingRequiredFieldItemsFromZodError(
      result.error,
      (field) => field
    );

    expect(missing).toEqual([]);
  });

  it('includes summary required refine failures', () => {
    const result = createActivityRequestSchema.safeParse(
      minimalCreateRequest({ summary: '' })
    );
    expect(result.success).toBe(false);
    if (result.success) return;

    const missing = getMissingRequiredFieldItemsFromZodError(
      result.error,
      (field) => field
    );

    expect(missing.map((item) => item.name)).toContain('summary');
  });

  it('excludes commsContacts when contacts exist but no lead is selected', () => {
    const result = createActivityRequestSchema.safeParse(
      minimalCreateRequest({
        commsContacts: [{ userId: 1, isLead: false }],
      })
    );
    expect(result.success).toBe(false);
    if (result.success) return;

    const missing = getMissingRequiredFieldItemsFromZodError(
      result.error,
      (field) => field
    );
    expect(missing).toEqual([]);
  });

  it('excludes event-planner lead refine failures', () => {
    const result = createActivityRequestSchema.safeParse(
      minimalCreateRequest({
        eventPlanners: [{ eventPlannerName: 'Planner A', isLead: false }],
      })
    );
    expect(result.success).toBe(false);
    if (result.success) return;

    const missing = getMissingRequiredFieldItemsFromZodError(
      result.error,
      (field) => field
    );

    expect(missing).toEqual([]);
  });

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
