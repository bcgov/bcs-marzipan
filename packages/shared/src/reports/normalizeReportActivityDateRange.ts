import { addCalendarDays, type CalendarDateString } from '../datetime';
import { MAX_REPORT_DATE_SPAN_YEARS } from './reportDateRangePolicy';
import {
  addCalendarMonths,
  firstDayOfCalendarMonth,
  lastDayOfCalendarMonth,
} from './thirty-sixty-ninety/buildCalendarMonthSections';

export type InferredReportDateBound = 'start' | 'end' | 'both' | null;

export interface ReportDateRange {
  start: CalendarDateString;
  end: CalendarDateString;
}

export interface NormalizedReportDateRange extends ReportDateRange {
  wasClamped: boolean;
  inferredBound: InferredReportDateBound;
  spanDays: number;
}

export interface NormalizeReportActivityDateRangeInput {
  startDateFrom?: string;
  startDateTo?: string;
  /** Used when neither bound is provided. */
  defaultRange?: ReportDateRange;
  maxSpanYears?: number;
}

function toCalendarDate(value: string): CalendarDateString | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed as CalendarDateString;
}

/** Move a calendar date by whole months, preserving day-of-month when possible. */
function addCalendarMonthsToDate(
  date: CalendarDateString,
  months: number
): CalendarDateString {
  const day = Number(date.slice(8, 10));
  const monthStart = firstDayOfCalendarMonth(date);
  const targetMonthStart = addCalendarMonths(monthStart, months);
  const lastDay = Number(lastDayOfCalendarMonth(targetMonthStart).slice(8, 10));
  const clampedDay = Math.min(day, lastDay);
  return `${targetMonthStart.slice(0, 7)}-${String(clampedDay).padStart(2, '0')}` as CalendarDateString;
}

function maxEndFromStart(
  start: CalendarDateString,
  maxSpanYears: number
): CalendarDateString {
  const months = maxSpanYears * 12;
  return addCalendarDays(addCalendarMonthsToDate(start, months), -1);
}

function minStartFromEnd(
  end: CalendarDateString,
  maxSpanYears: number
): CalendarDateString {
  const months = maxSpanYears * 12;
  return addCalendarDays(addCalendarMonthsToDate(end, -months), 1);
}

function inclusiveSpanDays(
  start: CalendarDateString,
  end: CalendarDateString
): number {
  const [sy, sm, sd] = start.split('-').map(Number) as [number, number, number];
  const [ey, em, ed] = end.split('-').map(Number) as [number, number, number];
  const startUtc = Date.UTC(sy, sm - 1, sd);
  const endUtc = Date.UTC(ey, em - 1, ed);
  return Math.floor((endUtc - startUtc) / 86_400_000) + 1;
}

function clampRangeToMaxSpan(
  start: CalendarDateString,
  end: CalendarDateString,
  maxSpanYears: number
): { start: CalendarDateString; end: CalendarDateString; wasClamped: boolean } {
  const maxEnd = maxEndFromStart(start, maxSpanYears);
  if (end <= maxEnd) {
    return { start, end, wasClamped: false };
  }
  return { start, end: maxEnd, wasClamped: true };
}

/**
 * Resolves optional report date bounds into a bounded window for DB queries
 * and section scaffolding.
 *
 * - Single bound → infer the missing bound at `maxSpanYears` from the provided bound.
 * - Both bounds, start after end → swap to chronological order.
 * - Both bounds, span > max → keep start, trim end.
 * - Neither bound → `defaultRange` (required).
 */
export function normalizeReportActivityDateRange(
  input: NormalizeReportActivityDateRangeInput
): NormalizedReportDateRange {
  const maxSpanYears = input.maxSpanYears ?? MAX_REPORT_DATE_SPAN_YEARS;
  const fromRaw = input.startDateFrom?.trim();
  const toRaw = input.startDateTo?.trim();
  const startProvided = fromRaw ? toCalendarDate(fromRaw) : null;
  const endProvided = toRaw ? toCalendarDate(toRaw) : null;

  let start: CalendarDateString;
  let end: CalendarDateString;
  let inferredBound: InferredReportDateBound = null;
  let wasClamped = false;

  if (startProvided && endProvided) {
    start = startProvided;
    end = endProvided;
    if (start > end) {
      [start, end] = [end, start];
    }
    const clamped = clampRangeToMaxSpan(start, end, maxSpanYears);
    start = clamped.start;
    end = clamped.end;
    wasClamped = clamped.wasClamped;
  } else if (startProvided) {
    start = startProvided;
    end = maxEndFromStart(start, maxSpanYears);
    inferredBound = 'end';
  } else if (endProvided) {
    end = endProvided;
    start = minStartFromEnd(end, maxSpanYears);
    inferredBound = 'start';
  } else if (input.defaultRange) {
    start = input.defaultRange.start;
    end = input.defaultRange.end;
    inferredBound = 'both';
    const clamped = clampRangeToMaxSpan(start, end, maxSpanYears);
    start = clamped.start;
    end = clamped.end;
    wasClamped = clamped.wasClamped;
  } else {
    throw new Error(
      'normalizeReportActivityDateRange requires at least one date bound or defaultRange'
    );
  }

  return {
    start,
    end,
    wasClamped,
    inferredBound,
    spanDays: inclusiveSpanDays(start, end),
  };
}
