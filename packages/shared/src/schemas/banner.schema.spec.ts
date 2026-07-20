import { describe, expect, it } from 'vitest';

import {
  BANNER_CONTENT_MAX_LENGTH,
  upsertBannerSettingsRequestSchema,
} from './banner.schema';

function validBannerBody(overrides: Record<string, unknown> = {}) {
  return {
    isActive: true,
    content: '<p>Banner message</p>',
    backgroundColor: '#E6A635',
    textColor: '#000000',
    variant: 'info',
    isDismissible: true,
    dismissScope: 'persistent',
    startDateTime: null,
    endDateTime: null,
    ...overrides,
  };
}

describe('upsertBannerSettingsRequestSchema', () => {
  it('accepts valid request', () => {
    const result = upsertBannerSettingsRequestSchema.parse(validBannerBody());
    expect(result.content).toBe('<p>Banner message</p>');
  });

  it('enforces content max length', () => {
    upsertBannerSettingsRequestSchema.parse(
      validBannerBody({ content: 'a'.repeat(BANNER_CONTENT_MAX_LENGTH) })
    );

    expect(() =>
      upsertBannerSettingsRequestSchema.parse(
        validBannerBody({ content: 'a'.repeat(BANNER_CONTENT_MAX_LENGTH + 1) })
      )
    ).toThrow();
  });

  it('rejects endDateTime earlier than startDateTime', () => {
    const result = upsertBannerSettingsRequestSchema.safeParse(
      validBannerBody({
        startDateTime: '2030-01-02T12:00:00.000Z',
        endDateTime: '2030-01-01T12:00:00.000Z',
      })
    );

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('Expected validation failure for invalid date range');
    }
    expect(result.error.issues[0]?.path).toEqual(['endDateTime']);
  });
});
