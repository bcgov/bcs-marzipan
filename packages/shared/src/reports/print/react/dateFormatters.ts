/**
 * Date/time formatting helpers for print report React components.
 *
 * All formatters are intentionally pure and locale-deterministic (`en-CA` for
 * machine-stable ISO dates, `en-US` for human-facing strings) so server and
 * client produce identical markup.
 */

/** Local calendar-day key `YYYY-MM-DD` (ignores any `Z` / offset in the ISO). */
export function dateKeyLocal(
  isoDate: string | null | undefined
): string | null {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parses a `YYYY-MM-DD` key back into a local-midnight `Date`. */
export function parseKeyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Human date heading used above each day group, e.g. `MONDAY, APRIL 27, 2026`. */
export function formatDayHeading(d: Date): string {
  return d
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();
}

/** Cover/range formatting, e.g. `Mon, Apr 27, 2026`. */
export function formatCoverDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Compact date cell, e.g. `Apr 27, 2026`. */
export function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Last-updated timestamp, e.g. `Apr 27, 2026 9:15 am`. */
export function formatLastUpdated(
  isoDateTime: string | null | undefined
): string {
  if (!isoDateTime) return '';
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = d
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return `${datePart} ${timePart}`;
}

/** 12-hour time with lowercase am/pm, e.g. `9:15 am`. Returns `''` when absent. */
export function formatTime12h(
  isoDate: string | null | undefined,
  timeStr: string | null | undefined
): string {
  if (timeStr) {
    const [h, m] = timeStr.split(':');
    const hourParsed = Number.parseInt(h ?? '0', 10);
    const minuteParsed = Number.parseInt((m ?? '00').padStart(2, '0'), 10);
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
  if (isoDate) {
    const d = new Date(isoDate);
    if (!Number.isNaN(d.getTime())) {
      return d
        .toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
        .toLowerCase()
        .replace(/\s+/g, ' ');
    }
  }
  return '';
}

/** e.g. `Tuesday Apr 28, 9:38 pm` — for print / PDF page footers (no year, lowercase am/pm). */
export function formatPrintReportGeneratedAt(now: Date): string {
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const month = now.toLocaleDateString('en-US', { month: 'short' });
  const day = now.getDate();
  const time = now
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return `${weekday} ${month} ${day}, ${time}`;
}

export function formatGeneratedAt(now: Date): string {
  return formatPrintReportGeneratedAt(now);
}

export const PRINT_FOOTER_CHANGED_EXPLANATION =
  'CHANGED indicates major detail or date changes only (not time switches).';
