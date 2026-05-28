import {
  isCalendarDateString,
  toCalendarDateString,
  type CalendarDateString,
} from '../../datetime/types';
import {
  addCalendarMonths,
  defaultThirtySixtyNinetyDateRange,
  firstDayOfCalendarMonth,
  lastDayOfCalendarMonth,
  type CalendarMonthDateRange,
} from './buildCalendarMonthSections';

/** Max calendar months shown when only one date bound is provided. */
export const MAX_THIRTY_SIXTY_NINETY_DISPLAY_MONTHS = 6;

export interface ThirtySixtyNinetyQueryWindow {
  /** Bounded range used to scaffold month sections (including empty months). */
  sectionRange: CalendarMonthDateRange;
  /** Activity query lower bound; omitted for open-ended past. */
  queryStartDateFrom?: CalendarDateString;
  /** Activity query upper bound; omitted for open-ended future. */
  queryStartDateTo?: CalendarDateString;
}

function toCalendarDate(value: string): CalendarDateString {
  if (isCalendarDateString(value)) return value;
  const parsed = toCalendarDateString(value);
  if (parsed == null) {
    throw new Error(`Invalid calendar date: ${value}`);
  }
  return parsed;
}

function displayEndForOpenStart(start: CalendarDateString): CalendarDateString {
  const monthStart = firstDayOfCalendarMonth(start);
  const monthEnd = lastDayOfCalendarMonth(
    addCalendarMonths(monthStart, MAX_THIRTY_SIXTY_NINETY_DISPLAY_MONTHS - 1)
  );
  return monthEnd >= start ? monthEnd : lastDayOfCalendarMonth(monthStart);
}

function displayStartForOpenEnd(end: CalendarDateString): CalendarDateString {
  const monthStart = firstDayOfCalendarMonth(end);
  return addCalendarMonths(
    monthStart,
    -(MAX_THIRTY_SIXTY_NINETY_DISPLAY_MONTHS - 1)
  );
}

/**
 * Resolves the 30/60/90 report window from optional query date bounds.
 *
 * - Both bounds: exact window for sections and query.
 * - Start only: query is open to the future; sections span up to
 *   {@link MAX_THIRTY_SIXTY_NINETY_DISPLAY_MONTHS} months from the start month.
 * - End only: query is open to the past; sections span up to
 *   {@link MAX_THIRTY_SIXTY_NINETY_DISPLAY_MONTHS} months ending at `end`.
 * - Neither: default three-month preset anchored to the current Pacific month.
 */
export function resolveThirtySixtyNinetyQueryWindow(
  query: { startDateFrom?: string; startDateTo?: string },
  now: Date = new Date()
): ThirtySixtyNinetyQueryWindow {
  const fromRaw = query.startDateFrom?.trim();
  const toRaw = query.startDateTo?.trim();

  if (fromRaw && toRaw) {
    const start = toCalendarDate(fromRaw);
    const end = toCalendarDate(toRaw);
    return {
      sectionRange: { start, end },
      queryStartDateFrom: start,
      queryStartDateTo: end,
    };
  }

  if (fromRaw) {
    const start = toCalendarDate(fromRaw);
    return {
      sectionRange: { start, end: displayEndForOpenStart(start) },
      queryStartDateFrom: start,
    };
  }

  if (toRaw) {
    const end = toCalendarDate(toRaw);
    return {
      sectionRange: { start: displayStartForOpenEnd(end), end },
      queryStartDateTo: end,
    };
  }

  const preset = defaultThirtySixtyNinetyDateRange(3, now);
  return {
    sectionRange: preset,
    queryStartDateFrom: preset.start,
    queryStartDateTo: preset.end,
  };
}
