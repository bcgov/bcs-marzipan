import { pacificCalendarDateFromInstant } from '@corpcal/shared';

/**
 * Parses search text like "Mar 20" or "March 20, 2026" into a Pacific
 * calendar date key (`YYYY-MM-DD`) for history timestamp filtering.
 */
export function parseMonthDaySearchToPacificDateKey(
  raw: string,
  now: Date = new Date()
): string | null {
  const monthDayMatch = raw.match(/^([A-Za-z]+)\s+(\d{1,2})(?:,?\s*(\d{4}))?$/);
  if (!monthDayMatch) return null;

  const monthName = monthDayMatch[1];
  const day = parseInt(monthDayMatch[2], 10);
  const pacificToday = pacificCalendarDateFromInstant(now);
  const defaultYear = pacificToday
    ? parseInt(pacificToday.slice(0, 4), 10)
    : now.getUTCFullYear();
  const year = monthDayMatch[3] ? parseInt(monthDayMatch[3], 10) : defaultYear;

  const monthProbe = new Date(`${monthName} 1, ${year} 12:00:00 UTC`);
  if (Number.isNaN(monthProbe.getTime())) return null;

  const monthIndex = monthProbe.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) return null;

  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}
