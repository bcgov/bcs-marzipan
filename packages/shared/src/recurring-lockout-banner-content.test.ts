import { describe, expect, it, vi } from 'vitest';

import {
  appendRecurringLockoutBypassNotice,
  DEFAULT_RECURRING_LOCKOUT_ACTIVE_CONTENT,
  DEFAULT_RECURRING_LOCKOUT_LEAD_CONTENT,
  formatRecurringLockoutContactForBanner,
  getRecurringLockoutBannerPhase,
  isLikelyEmailAddress,
  resolveRecurringLockoutBannerContent,
} from './recurring-lockout-banner-content';

const schedule = {
  isActive: true,
  startTimeOfDay: '14:00',
  endTimeOfDay: '16:00',
  bannerLeadMinutes: 20,
};

describe('getRecurringLockoutBannerPhase', () => {
  it('returns null before the banner window starts', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T20:39:00.000Z'));

    expect(getRecurringLockoutBannerPhase(schedule)).toBeNull();

    vi.useRealTimers();
  });

  it('returns lead-up during the warning window before lockout start', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T20:40:00.000Z'));

    expect(getRecurringLockoutBannerPhase(schedule)).toBe('lead-up');

    vi.useRealTimers();
  });

  it('returns active during the lockout window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T21:00:00.000Z'));

    expect(getRecurringLockoutBannerPhase(schedule)).toBe('active');

    vi.useRealTimers();
  });
});

describe('formatRecurringLockoutContactForBanner', () => {
  it('renders a mailto link for email-shaped contact values', () => {
    expect(formatRecurringLockoutContactForBanner('gcpe@example.com')).toBe(
      '<a href="mailto:gcpe@example.com">gcpe@example.com</a>'
    );
  });

  it('escapes plain-text contact values without mailto', () => {
    expect(
      formatRecurringLockoutContactForBanner('GCPE inbox (see SharePoint)')
    ).toBe('GCPE inbox (see SharePoint)');
  });

  it('uses the Corp Cal manager fallback when contact is empty', () => {
    expect(formatRecurringLockoutContactForBanner('')).toBe(
      'the Corp Cal manager'
    );
  });
});

describe('isLikelyEmailAddress', () => {
  it('accepts simple email addresses', () => {
    expect(isLikelyEmailAddress('gcpe@example.com')).toBe(true);
  });

  it('rejects plain-text labels', () => {
    expect(isLikelyEmailAddress('GCPE inbox')).toBe(false);
  });
});

describe('resolveRecurringLockoutBannerContent', () => {
  it('substitutes lead-up placeholders with formatted Pacific times', () => {
    const result = resolveRecurringLockoutBannerContent({
      phase: 'lead-up',
      leadContent: DEFAULT_RECURRING_LOCKOUT_LEAD_CONTENT,
      activeContent: DEFAULT_RECURRING_LOCKOUT_ACTIVE_CONTENT,
      startTimeOfDay: '15:00',
      endTimeOfDay: '23:59',
      contactEmail: '',
    });

    expect(result).toBe(
      'Updates to activities will be locked 3:00 pm - 11:59 pm PT. Please make updates before lockout begins.'
    );
  });

  it('substitutes active placeholders with end time and contact mailto', () => {
    const result = resolveRecurringLockoutBannerContent({
      phase: 'active',
      leadContent: DEFAULT_RECURRING_LOCKOUT_LEAD_CONTENT,
      activeContent: DEFAULT_RECURRING_LOCKOUT_ACTIVE_CONTENT,
      startTimeOfDay: '15:00',
      endTimeOfDay: '23:59',
      contactEmail: 'gcpe@example.com',
    });

    expect(result).toBe(
      'Updates to activities are locked out until 11:59 pm PT. Contact <a href="mailto:gcpe@example.com">gcpe@example.com</a> to make emerging or urgent updates.'
    );
  });
});

describe('appendRecurringLockoutBypassNotice', () => {
  it('appends the bypass notice below existing banner content', () => {
    expect(
      appendRecurringLockoutBypassNotice(
        'Updates to activities will be locked.'
      )
    ).toBe(
      'Updates to activities will be locked.<div>You have permission to bypass lockout and may continue edits.</div>'
    );
  });

  it('returns only the bypass notice when content is empty', () => {
    expect(appendRecurringLockoutBypassNotice('   ')).toBe(
      'You have permission to bypass lockout and may continue edits.'
    );
  });
});
