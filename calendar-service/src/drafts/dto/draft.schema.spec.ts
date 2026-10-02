import { describe, expect, it } from 'vitest';

import { draftLookupQuerySchema } from './draft.schema';

describe('draftLookupQuerySchema', () => {
  it('treats a blank entityId as omitted', () => {
    expect(
      draftLookupQuerySchema.parse({ formType: 'activity', entityId: '' })
    ).toEqual({
      formType: 'activity',
      entityId: undefined,
    });
    expect(
      draftLookupQuerySchema.parse({ formType: 'activity', entityId: '   ' })
    ).toEqual({
      formType: 'activity',
      entityId: undefined,
    });
  });

  it('parses a supplied entityId as an integer', () => {
    expect(
      draftLookupQuerySchema.parse({ formType: 'activity', entityId: '42' })
    ).toEqual({
      formType: 'activity',
      entityId: 42,
    });
  });
});
