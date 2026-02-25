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
 * Format a 24h time string (HH:mm) as "hh:mm am" / "hh:mm pm".
 */
export function formatTime12h(timeStr: string | null): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h ?? '0', 10);
  const minute = (m ?? '00').padStart(2, '0');
  const ampm = hour >= 12 ? 'pm' : 'am';
  const h12 = hour % 12 || 12;
  return `${h12}:${minute} ${ampm}`;
}

export type FormatExactDateOptions = {
  /** Include time, e.g. "Jan 23, 2026 at 2:00 PM". Default false. */
  includeTime?: boolean;
  /**
   * Include year: true = always "Jan 23, 2026"; false = "Jan 23"; 'auto' = omit when same as current year.
   * Default 'auto'.
   */
  includeYear?: boolean | 'auto';
};

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
  const now = new Date();
  const showYear =
    includeYear === true ||
    (includeYear === 'auto' && date.getFullYear() !== now.getFullYear());

  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(showYear && { year: 'numeric' }),
  });

  if (!includeTime) return datePart;
  return `${datePart} at ${formatTime(date)}`;
}

/**
 * Format a date range with year shown once at the end when same year (e.g. "Jan 23 – Feb 1, 2027"),
 * or omitted when that year is the current year ("Jan 23 – Feb 1"). When years differ, both are shown.
 */
export function formatDateRange(
  start: Date | string,
  end: Date | string
): string {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  const currentYear = new Date().getFullYear();
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear === endYear) {
    const startPart = formatExactDate(startDate, { includeYear: false });
    const showYear = startYear !== currentYear;
    const endPart = formatExactDate(endDate, {
      includeYear: showYear ? true : false,
    });
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
