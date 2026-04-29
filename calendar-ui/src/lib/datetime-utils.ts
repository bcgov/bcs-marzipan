export type FormatRelativeTimeOptions = {
  /** Short form: "5m ago", "in 22h" instead of "5 minutes ago", "in 22 hours". */
  short?: boolean;
};

const RELATIVE_INTERVALS: [number, string, string][] = [
  [60, 'minute', 'm'],
  [24, 'hour', 'h'],
  [7, 'day', 'd'],
  [4.34524, 'week', 'w'],
  [12, 'month', 'mo'],
  [Number.POSITIVE_INFINITY, 'year', 'y'],
];

/**
 * Returns a full relative-time phrase for past or future dates.
 * Past: "just now", "5 minutes ago", "2 hours ago", ...
 * Future: "just now", "in 5 minutes", "in 2 hours", ...
 * Handles clock skew / timezone (future dates) by using "from now" language.
 * Use with a context prefix only, e.g. "Updated " + formatRelativeTime(date).
 */
export function formatRelativeTime(
  date: Date,
  options?: FormatRelativeTimeOptions
): string {
  const short = options?.short ?? false;
  const seconds = Math.floor((date.getTime() - Date.now()) / 1000);
  const isPast = seconds <= 0;
  const absSeconds = Math.abs(seconds);

  if (absSeconds < 60) return 'just now';
  if (absSeconds < 60 * 60) {
    const value = Math.floor(absSeconds / 60);
    if (short) return isPast ? `${value}m ago` : `in ${value}m`;
    const label = value === 1 ? 'minute' : 'minutes';
    return isPast ? `${value} ${label} ago` : `in ${value} ${label}`;
  }

  let counter = Math.floor(absSeconds / 60);
  for (let i = 0; i < RELATIVE_INTERVALS.length; i++) {
    const [limit, nameLong, nameShort] = RELATIVE_INTERVALS[i];
    if (counter < limit) {
      const value = Math.floor(counter) || 0;
      if (short) {
        const unit = nameShort;
        return isPast ? `${value}${unit} ago` : `in ${value}${unit}`;
      }
      const label = value === 1 ? nameLong : `${nameLong}s`;
      return isPast ? `${value} ${label} ago` : `in ${value} ${label}`;
    }
    counter = Math.floor(counter / limit);
  }
  const value = Math.floor(counter) || 0;
  if (short) return isPast ? `${value}y ago` : `in ${value}y`;
  return isPast ? `${value} years ago` : `in ${value} years`;
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a 24h time string (e.g. HH:mm or H:mm) as "hh:mm am" / "hh:mm pm".
 * Invalid or out-of-range values (e.g. hour > 23, minute > 59) are clamped for
 * display rather than rejected; the function does not throw.
 */
export function formatTime12h(timeStr: string | null): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hourParsed = parseInt(h ?? '0', 10);
  const minuteParsed = parseInt((m ?? '00').padStart(2, '0'), 10);
  const hour = Number.isFinite(hourParsed)
    ? Math.min(23, Math.max(0, hourParsed))
    : 0;
  const minute = Number.isFinite(minuteParsed)
    ? Math.min(59, Math.max(0, minuteParsed))
    : 0;
  const minuteStr = String(minute).padStart(2, '0');
  const ampm = hour >= 12 ? 'pm' : 'am';
  const h12 = hour % 12 || 12;
  return `${h12}:${minuteStr} ${ampm}`;
}

export type FormatExactDateOptions = {
  /** Include time, e.g. "Jan 23, 2026 at 2:00 PM". Default false. */
  includeTime?: boolean;
  /**
   * Include year: true | 'auto' = always show (e.g. "Jan 23, 2026"); false = omit (e.g. "Jan 23").
   * Default 'auto' (always show year).
   */
  includeYear?: boolean | 'auto';
};

/**
 * Parse a YYYY-MM-DD date-only string as local midnight, avoiding the UTC-to-local
 * timezone shift that `new Date("YYYY-MM-DD")` introduces (ISO date-only strings are
 * parsed as UTC, which shifts the date back one day in timezones behind UTC).
 */
export function parseDateOnlyString(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  const [y, m, d] = parts;
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * Exact date (and optional time) for "Updated Jan 23, 2026" or "Updated Jan 23, 2026 at 2:00 PM".
 * Call site adds context prefix, e.g. "Updated " + formatExactDate(date).
 */
export function formatExactDate(
  date: Date,
  options?: FormatExactDateOptions
): string {
  const includeTime = options?.includeTime ?? false;
  const includeYear = options?.includeYear ?? 'auto';
  const showYear = includeYear !== false;

  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(showYear && { year: 'numeric' }),
  });

  if (!includeTime) return datePart;
  return `${datePart} at ${formatTime(date)}`;
}

/**
 * Local calendar date/time for an activity's scheduled end (`endDate` + `endTime` in the user's timezone).
 * All-day or missing `endTime`: date only (midnight local on `endDate`).
 */
export function getActivityEndLocalDate(
  endDate: string | null | undefined,
  endTime: string | null | undefined,
  isAllDay: boolean
): Date | null {
  if (endDate == null || endDate === '') return null;
  const parts = endDate.split('-').map((p) => parseInt(p, 10));
  if (parts.length < 3) return null;
  const [y, m, d] = parts;
  if (
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    !Number.isFinite(d) ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31
  ) {
    return null;
  }
  if (isAllDay || !endTime?.trim()) {
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const [hhStr, mmStr] = endTime.trim().split(':');
  const hh = parseInt(hhStr ?? '0', 10);
  const mm = parseInt((mmStr ?? '0').padStart(2, '0'), 10);
  const hour = Number.isFinite(hh) ? Math.min(23, Math.max(0, hh)) : 0;
  const minute = Number.isFinite(mm) ? Math.min(59, Math.max(0, mm)) : 0;
  return new Date(y, m - 1, d, hour, minute, 0, 0);
}

/** Display string for "This activity ended at …" in review/complete flows. */
export function formatActivityEndDateTimeLabel(
  endDate: string | null | undefined,
  endTime: string | null | undefined,
  isAllDay: boolean
): string | null {
  const d = getActivityEndLocalDate(endDate, endTime, isAllDay);
  if (!d) return null;
  const includeTime = !isAllDay && Boolean(endTime?.trim());
  return formatExactDate(d, { includeTime, includeYear: true });
}

/**
 * Format a date range. Year is always shown.
 * Same year: year once after the end date (e.g. "Dec 1 – Dec 4, 2026").
 * Different years: both years shown (e.g. "Dec 1, 2026 – Jan 31, 2027").
 */
export function formatDateRange(
  start: Date | string,
  end: Date | string
): string {
  const startDate =
    typeof start === 'string' ? parseDateOnlyString(start) : start;
  const endDate = typeof end === 'string' ? parseDateOnlyString(end) : end;
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear === endYear) {
    const startPart = formatExactDate(startDate, { includeYear: false });
    const endPart = formatExactDate(endDate, { includeYear: true });
    return `${startPart} \u2013 ${endPart}`;
  }
  return `${formatExactDate(startDate, { includeYear: true })} \u2013 ${formatExactDate(endDate, { includeYear: true })}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type StatusLookupItem = { name?: string; label?: string; id?: string | number };

export const CONFIRMED_STATUS_NAMES = ['confirmed'];
export const UNCONFIRMED_STATUS_NAMES = [
  'unknown',
  'not confirmed',
  'not_confirmed',
  'unconfirmed',
];

export const CONFIRMED_STATUS_LABEL = 'Confirmed';
export const UNCONFIRMED_STATUS_LABEL = 'Not confirmed';

export function normalizeStatusName(status: StatusLookupItem): string {
  return (status?.name ?? status?.label ?? '').toString().trim().toLowerCase();
}

export function findStatusByName(
  statuses: StatusLookupItem[] | undefined,
  names: string[]
): StatusLookupItem | undefined {
  return statuses?.find((s) => names.includes(normalizeStatusName(s)));
}
