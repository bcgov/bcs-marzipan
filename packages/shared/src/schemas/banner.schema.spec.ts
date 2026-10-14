import { describe, expect, it } from 'vitest';

import {
  BANNER_CONTENT_MAX_LENGTH,
  DEFAULT_RECURRING_EDIT_LOCKOUT_BANNER_LEAD_MINUTES,
  DEFAULT_RECURRING_EDIT_LOCKOUT_COUNTDOWN_LEAD_MINUTES,
  upsertBannerSettingsRequestSchema,
  upsertRecurringLockoutBannerSettingsRequestSchema,
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

function validRecurringBannerBody(overrides: Record<string, unknown> = {}) {
  return {
    isActive: true,
    leadContent:
      'Updates to activities will be locked <lockStartTime> - <lockEndTime> PT.',
    activeContent:
      'Updates to activities are locked out until <lockEndTime> PT. Contact <report_look_ahead_cover_contact_email>.',
    backgroundColor: '#E6A635',
    textColor: '#000000',
    variant: 'warning',
    startTimeOfDay: '15:00',
    endTimeOfDay: '23:59',
    bannerLeadMinutes: 30,
    editCountdownLeadMinutes: 3,
    ...overrides,
  };
}

describe('upsertRecurringLockoutBannerSettingsRequestSchema', () => {
  it('accepts valid request', () => {
    const result = upsertRecurringLockoutBannerSettingsRequestSchema.parse(
      validRecurringBannerBody()
    );
    expect(result.startTimeOfDay).toBe('15:00');
    expect(result.bannerLeadMinutes).toBe(30);
    expect(result.editCountdownLeadMinutes).toBe(3);
  });

  it('defaults edit countdown lead time when not provided', () => {
    const {
      bannerLeadMinutes: _unusedBannerLead,
      editCountdownLeadMinutes: _unusedCountdownLead,
      ...body
    } = validRecurringBannerBody();
    const result =
      upsertRecurringLockoutBannerSettingsRequestSchema.parse(body);

    expect(result.editCountdownLeadMinutes).toBe(
      DEFAULT_RECURRING_EDIT_LOCKOUT_COUNTDOWN_LEAD_MINUTES
    );
  });

  it('defaults banner lead time when not provided', () => {
    const { bannerLeadMinutes: _unusedLead, ...body } =
      validRecurringBannerBody();
    const result =
      upsertRecurringLockoutBannerSettingsRequestSchema.parse(body);

    expect(result.bannerLeadMinutes).toBe(
      DEFAULT_RECURRING_EDIT_LOCKOUT_BANNER_LEAD_MINUTES
    );
  });

  it('rejects negative banner lead time', () => {
    const result = upsertRecurringLockoutBannerSettingsRequestSchema.safeParse(
      validRecurringBannerBody({ bannerLeadMinutes: -1 })
    );

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('Expected validation failure for negative lead time');
    }
    expect(result.error.issues[0]?.path).toEqual(['bannerLeadMinutes']);
  });

  it('rejects zero edit countdown lead time', () => {
    const result = upsertRecurringLockoutBannerSettingsRequestSchema.safeParse(
      validRecurringBannerBody({ editCountdownLeadMinutes: 0 })
    );

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error(
        'Expected validation failure for zero edit countdown lead time'
      );
    }
    expect(result.error.issues[0]?.path).toEqual(['editCountdownLeadMinutes']);
  });

  it('rejects invalid time format', () => {
    const result = upsertRecurringLockoutBannerSettingsRequestSchema.safeParse(
      validRecurringBannerBody({ startTimeOfDay: '3:00 PM' })
    );

    expect(result.success).toBe(false);
  });

  it('rejects endTimeOfDay earlier than startTimeOfDay', () => {
    const result = upsertRecurringLockoutBannerSettingsRequestSchema.safeParse(
      validRecurringBannerBody({
        startTimeOfDay: '21:00',
        endTimeOfDay: '20:59',
      })
    );

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('Expected validation failure for invalid time range');
    }
    expect(result.error.issues[0]?.path).toEqual(['endTimeOfDay']);
  });
});
