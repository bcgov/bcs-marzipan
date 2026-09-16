import { formatCivilTime12h } from './datetime/format';
import {
  isWithinRecurringEditLockoutWindow,
  isWithinRecurringLockoutBannerWindow,
  type RecurringLockoutBannerScheduleSlice,
} from './recurring-edit-lockout';

export const RECURRING_LOCKOUT_BANNER_LOCK_START_TIME_PLACEHOLDER =
  '<lockStartTime>' as const;

export const RECURRING_LOCKOUT_BANNER_LOCK_END_TIME_PLACEHOLDER =
  '<lockEndTime>' as const;

export const RECURRING_LOCKOUT_BANNER_CONTACT_EMAIL_PLACEHOLDER =
  '<report_look_ahead_cover_contact_email>' as const;

export const DEFAULT_RECURRING_LOCKOUT_LEAD_CONTENT =
  'Updates to activities will be locked <lockStartTime> - <lockEndTime> PT. Please make updates before lockout begins.';

export const DEFAULT_RECURRING_LOCKOUT_ACTIVE_CONTENT =
  'Updates to activities are locked out until <lockEndTime> PT. Contact <report_look_ahead_cover_contact_email> to make emerging or urgent updates.';

export const RECURRING_LOCKOUT_BANNER_CONTACT_FALLBACK =
  'the Corp Cal manager' as const;

export const RECURRING_LOCKOUT_BANNER_BYPASS_NOTICE =
  'You have permission to bypass lockout and may continue edits.' as const;

export type RecurringLockoutBannerPhase = 'lead-up' | 'active';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isLikelyEmailAddress(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes(' ')) {
    return false;
  }

  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0 || atIndex !== trimmed.lastIndexOf('@')) {
    return false;
  }

  const domainPart = trimmed.slice(atIndex + 1);
  const dotIndex = domainPart.indexOf('.');

  return (
    domainPart.length > 0 && dotIndex > 0 && dotIndex < domainPart.length - 1
  );
}

export function formatRecurringLockoutContactForBanner(
  contactEmail: string
): string {
  const trimmed = contactEmail.trim();

  if (!trimmed) {
    return escapeHtml(RECURRING_LOCKOUT_BANNER_CONTACT_FALLBACK);
  }

  if (isLikelyEmailAddress(trimmed)) {
    const escaped = escapeHtml(trimmed);
    return `<a href="mailto:${escaped}">${escaped}</a>`;
  }

  return escapeHtml(trimmed);
}

export function getRecurringLockoutBannerPhase(
  settings: RecurringLockoutBannerScheduleSlice,
  nowMs: number = Date.now()
): RecurringLockoutBannerPhase | null {
  if (!isWithinRecurringLockoutBannerWindow(settings, nowMs)) {
    return null;
  }

  if (isWithinRecurringEditLockoutWindow(settings, nowMs)) {
    return 'active';
  }

  return 'lead-up';
}

export type ResolveRecurringLockoutBannerContentInput = {
  phase: RecurringLockoutBannerPhase;
  leadContent: string;
  activeContent: string;
  startTimeOfDay: string;
  endTimeOfDay: string;
  contactEmail: string;
};

export function resolveRecurringLockoutBannerContent(
  input: ResolveRecurringLockoutBannerContentInput
): string {
  const template =
    input.phase === 'lead-up' ? input.leadContent : input.activeContent;
  const lockStartTime = formatCivilTime12h(input.startTimeOfDay);
  const lockEndTime = formatCivilTime12h(input.endTimeOfDay);
  const contactHtml = formatRecurringLockoutContactForBanner(
    input.contactEmail
  );

  return template
    .replaceAll(
      RECURRING_LOCKOUT_BANNER_LOCK_START_TIME_PLACEHOLDER,
      lockStartTime
    )
    .replaceAll(RECURRING_LOCKOUT_BANNER_LOCK_END_TIME_PLACEHOLDER, lockEndTime)
    .replaceAll(
      RECURRING_LOCKOUT_BANNER_CONTACT_EMAIL_PLACEHOLDER,
      contactHtml
    );
}

export function appendRecurringLockoutBypassNotice(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return RECURRING_LOCKOUT_BANNER_BYPASS_NOTICE;
  }

  return `${trimmed}<div>${RECURRING_LOCKOUT_BANNER_BYPASS_NOTICE}</div>`;
}
