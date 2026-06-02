import {
  isCalendarDateString,
  toCalendarDateString,
  type CalendarDateString,
} from '../../datetime/types';
import { normalizeReportActivityDateRange } from '../normalizeReportActivityDateRange';
import {
  defaultThirtySixtyNinetyDateRange,
  type CalendarMonthDateRange,
} from './buildCalendarMonthSections';

export interface ThirtySixtyNinetyQueryWindow {
  /** Bounded range used to scaffold month sections (including empty months). */
  sectionRange: CalendarMonthDateRange;
  /** Activity query lower bound; always set once the window is resolved. */
  queryStartDateFrom: CalendarDateString;
  /** Activity query upper bound; always set once the window is resolved. */
  queryStartDateTo: CalendarDateString;
}

function toCalendarDate(value: string): CalendarDateString {
  if (isCalendarDateString(value)) return value;
  const parsed = toCalendarDateString(value);
  if (parsed == null) {
    throw new Error(`Invalid calendar date: ${value}`);
  }
  return parsed;
}

/**
 * Resolves the 30/60/90 report window from optional query date bounds.
 *
 * Open-ended inputs are bounded via the shared report date normalizer (2-year max).
 * Section scaffolding and DB query always use the same resolved range.
 */
export function resolveThirtySixtyNinetyQueryWindow(
  query: { startDateFrom?: string; startDateTo?: string },
  now: Date = new Date()
): ThirtySixtyNinetyQueryWindow {
  const fromRaw = query.startDateFrom?.trim();
  const toRaw = query.startDateTo?.trim();
  const defaultRange =
    fromRaw || toRaw ? undefined : defaultThirtySixtyNinetyDateRange(3, now);

  const normalized = normalizeReportActivityDateRange({
    startDateFrom: fromRaw ? toCalendarDate(fromRaw) : undefined,
    startDateTo: toRaw ? toCalendarDate(toRaw) : undefined,
    defaultRange,
  });

  return {
    sectionRange: { start: normalized.start, end: normalized.end },
    queryStartDateFrom: normalized.start,
    queryStartDateTo: normalized.end,
  };
}
