import {
  addCalendarDays,
  CORP_PACIFIC_LABEL,
  CORP_PACIFIC_TIME_ZONE,
  formatCalendarDateShort,
  formatCivilTime12h,
  formatInstantInPacific as formatInstantInPacificShared,
  formatInstantPacificDate as formatInstantPacificDateShared,
  formatInstantPacificTime as formatInstantPacificTimeShared,
  isCalendarDateString,
  pacificCalendarDateFromInstant,
  pacificCivilToInstantMs,
} from '@corpcal/shared';

export type FormatRelativeTimeOptions = {
  /** Short form: "5m ago", "in 22h" instead of "5 minutes ago", "in 22 hours". */
  short?: boolean;
};

/**
 * Optional `timeZone` for `Intl` calls. When omitted, the formatter uses the
 * host (browser) timezone — appropriate when the caller already has a local
 * `Date` from a date picker. When formatting an **instant** from the API
 * (`lastUpdatedDateTime`, `createdDateTime`, etc.), pass
 * {@link CORP_PACIFIC_TIME_ZONE} so output is identical regardless of the
 * host TZ.
 *
 * See `docs/DATE_AND_TIMEZONE.md`.
 */
export type IntlTimeZoneOption = {
  timeZone?: string;
};

export { CORP_PACIFIC_LABEL, CORP_PACIFIC_TIME_ZONE };

/** Suffix for Pacific (fixed UTC-7) wall-clock times in UI copy. */
const PACIFIC_TIME_ABBREV_SUFFIX = ' PT';

/**
 * True when both instants fall on the same calendar day in corp Pacific
 * (fixed UTC-7), independent of the host timezone.
 */
export function isSamePacificCalendarDay(a: Date, b: Date): boolean {
  const ka = pacificCalendarDateFromInstant(a);
  const kb = pacificCalendarDateFromInstant(b);
  return ka != null && kb != null && ka === kb;
}

export type ActivityHistoryRecencyBucket = 'Today' | 'This week' | 'Earlier';
export type HistoryRecencyBucket =
  | 'Today'
  | 'Yesterday'
  | 'This week'
  | 'Earlier';

export const HISTORY_RECENCY_BUCKETS: readonly HistoryRecencyBucket[] = [
  'Today',
  'Yesterday',
  'This week',
  'Earlier',
];

function pacificStartOfCalendarDayMs(dateKey: string): number | null {
  return pacificCivilToInstantMs(dateKey, '00:00:00');
}

/**
 * Buckets audit timestamps like Activity History: matches prior "from midnight
 * today / from midnight today−7 forward" semantics but uses **corp Pacific**
 * calendar days so buckets align with Pacific-formatted timestamps.
 */
export function pacificActivityHistoryRecencyBucket(
  entryInstant: Date,
  now: Date = new Date()
): ActivityHistoryRecencyBucket {
  const todayKey = pacificCalendarDateFromInstant(now);
  if (todayKey == null) return 'Earlier';

  const todayStart = pacificStartOfCalendarDayMs(todayKey);
  if (todayStart == null) return 'Earlier';

  const ms = entryInstant.getTime();
  if (Number.isNaN(ms)) return 'Earlier';

  if (ms >= todayStart) return 'Today';

  const weekStartKey = addCalendarDays(todayKey, -7);
  const weekStart = pacificStartOfCalendarDayMs(weekStartKey);
  if (weekStart != null && ms >= weekStart) return 'This week';

  return 'Earlier';
}

/**
 * Compact audit-list grouping based on corporate Pacific calendar dates.
 * "This week" preserves the existing rolling seven-day history window after
 * extracting today and yesterday into their own groups.
 */
export function pacificHistoryRecencyBucket(
  entryInstant: Date,
  now: Date = new Date()
): HistoryRecencyBucket {
  const entryKey = pacificCalendarDateFromInstant(entryInstant);
  const todayKey = pacificCalendarDateFromInstant(now);
  if (entryKey == null || todayKey == null) return 'Earlier';
  if (entryKey === todayKey) return 'Today';

  const yesterdayKey = addCalendarDays(todayKey, -1);
  if (entryKey === yesterdayKey) return 'Yesterday';

  const weekStartKey = addCalendarDays(todayKey, -7);
  if (entryKey >= weekStartKey && entryKey < yesterdayKey) return 'This week';
  return 'Earlier';
}

/**
 * Section heading for global/history lists: "Today" when the instant falls on
 * the same Pacific calendar day as `now`; otherwise a long Pacific date.
 */
export function formatPacificHistoryListDayHeading(
  timestamp: Date,
  now: Date = new Date()
): string {
  if (isSamePacificCalendarDay(timestamp, now)) {
    return 'Today';
  }
  return formatLongDate(timestamp, { timeZone: CORP_PACIFIC_TIME_ZONE });
}

/** Subset of {@link DateRangeValue} for Pacific calendar-day range checks. */
export type PacificDateFilterRange = {
  startDate: string;
  endDate: string;
  noStartDate: boolean;
  noEndDate: boolean;
};

/**
 * True when the entry's **Pacific** calendar date lies within the inclusive
 * `YYYY-MM-DD` bounds (lexicographic compare). Use with an active date filter
 * only; does not mirror {@link isDateRangeActive}.
 */
export function isTimestampInPacificDateFilter(
  timestamp: Date,
  range: PacificDateFilterRange
): boolean {
  const key = pacificCalendarDateFromInstant(timestamp);
  if (key == null) return false;

  if (range.startDate && !range.noStartDate) {
    if (key < range.startDate) return false;
  }
  if (range.endDate && !range.noEndDate) {
    if (key > range.endDate) return false;
  }
  return true;
}

/**
 * Inclusive Pacific calendar range ending on the Pacific calendar day of
 * `now`, spanning `inclusiveDayCount` days (`1` ⇒ today only).
 */
export function pacificInclusiveCalendarRangeEndingToday(
  inclusiveDayCount: number,
  now: Date = new Date()
): { startDate: string; endDate: string } | null {
  if (inclusiveDayCount < 1) return null;
  const end = pacificCalendarDateFromInstant(now);
  if (end == null) return null;
  const start = addCalendarDays(end, -(inclusiveDayCount - 1));
  return { startDate: start, endDate: end };
}

/**
 * Pacific wall-clock time for labels like "Updated today at …", including
 * `PT` so the zone is explicit (e.g. `4:21 pm PT`).
 */
export function formatPacificTimeWithAbbrev(date: Date): string {
  const clock = formatTime(date, { timeZone: CORP_PACIFIC_TIME_ZONE });
  return clock === '' ? '' : `${clock}${PACIFIC_TIME_ABBREV_SUFFIX}`;
}

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

export function formatLongDate(
  date: Date,
  options?: IntlTimeZoneOption
): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    ...(options?.timeZone ? { timeZone: options.timeZone } : {}),
  });
}

export function formatTime(date: Date, options?: IntlTimeZoneOption): string {
  return date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      ...(options?.timeZone ? { timeZone: options.timeZone } : {}),
    })
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Format a 24h civil time string (e.g. HH:mm) as lowercase 12h (`9:30 am`).
 * Delegates to `@corpcal/shared` so parsing matches print exports and jobs.
 */
export function formatTime12h(timeStr: string | null): string {
  return formatCivilTime12h(timeStr);
}

export type FormatExactDateOptions = IntlTimeZoneOption & {
  /** Include time, e.g. "Jan 23, 2026 at 2:00 pm". Default false. */
  includeTime?: boolean;
  /**
   * Include year: true | 'auto' = always show (e.g. "Jan 23, 2026"); false = omit (e.g. "Jan 23").
   * Default 'auto' (always show year).
   */
  includeYear?: boolean | 'auto';
  /**
   * When true with {@link includeTime}, appends ` PT` after the time so Pacific
   * (fixed UTC-7) wall-clock is explicit in UI copy.
   */
  appendPacificTimeAbbrev?: boolean;
};

/**
 * Parse a `YYYY-MM-DD` date-only string as **host-local midnight**, avoiding
 * the UTC-to-local shift that `new Date('YYYY-MM-DD')` introduces (ISO
 * date-only strings parse as UTC and shift behind UTC).
 *
 * The returned Date is intended for downstream `toLocaleDateString` callers
 * that read host-local components symmetrically — both the construction and
 * the formatter use host TZ, so the rendered calendar day matches the input
 * regardless of where the host clock is set.
 *
 * For UI code that needs to format an **instant** (an audit timestamp from
 * the API), do not parse with this helper; use the corp Pacific helpers
 * (`formatInstantInPacific`, `formatInstantPacificTime`) directly.
 */
export function parseDateOnlyString(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  const [y, m, d] = parts;
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * Exact date (and optional time) for "Updated Jan 23, 2026" or "Updated Jan 23, 2026 at 2:00 pm".
 * Call site adds context prefix, e.g. "Updated " + formatExactDate(date).
 *
 * Pass `timeZone: CORP_PACIFIC_TIME_ZONE` when formatting an instant from the
 * API so output is the same regardless of the host TZ.
 */
export function formatExactDate(
  date: Date,
  options?: FormatExactDateOptions
): string {
  const includeTime = options?.includeTime ?? false;
  const includeYear = options?.includeYear ?? 'auto';
  const showYear = includeYear !== false;
  const timeZone = options?.timeZone;

  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(showYear && { year: 'numeric' }),
    ...(timeZone ? { timeZone } : {}),
  });

  if (!includeTime) return datePart;
  const withTime = `${datePart} at ${formatTime(date, { timeZone })}`;
  if (options?.appendPacificTimeAbbrev) {
    return `${withTime}${PACIFIC_TIME_ABBREV_SUFFIX}`;
  }
  return withTime;
}

/**
 * Convenience for the common "format an instant in Pacific" cases. These
 * delegate to `@corpcal/shared` so behavior stays in lockstep with the rest
 * of the app (print exports, scheduled jobs, etc.).
 */
export function formatInstantInPacific(
  instant: string | Date | number | null | undefined
): string {
  const s = formatInstantInPacificShared(instant);
  return s === '' ? '' : `${s}${PACIFIC_TIME_ABBREV_SUFFIX}`;
}

export function formatInstantPacificDate(
  instant: string | Date | number | null | undefined
): string {
  return formatInstantPacificDateShared(instant);
}

export function formatInstantPacificTime(
  instant: string | Date | number | null | undefined
): string {
  const s = formatInstantPacificTimeShared(instant);
  return s === '' ? '' : `${s}${PACIFIC_TIME_ABBREV_SUFFIX}`;
}

/**
 * Display string for "This activity ended at …" in review/complete flows.
 * Scheduled `endDate` / `endTime` are interpreted as **Pacific fixed UTC-7**
 * civil time (see `docs/DATE_AND_TIMEZONE.md`), matching the API contract.
 */
export function formatActivityEndDateTimeLabel(
  endDate: string | null | undefined,
  endTime: string | null | undefined,
  isAllDay: boolean
): string | null {
  if (endDate == null || endDate === '') return null;
  if (!isCalendarDateString(endDate)) return null;

  const includeTime = !isAllDay && Boolean(endTime?.trim());
  if (!includeTime) {
    return formatCalendarDateShort(endDate);
  }

  const ms = pacificCivilToInstantMs(endDate, endTime!.trim());
  if (ms == null) return null;

  return formatExactDate(new Date(ms), {
    includeTime: true,
    includeYear: true,
    timeZone: CORP_PACIFIC_TIME_ZONE,
    appendPacificTimeAbbrev: true,
  });
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
