import type { ReportActivityRow } from '../../api/types';
import type { CalendarDateString } from '../../datetime/types';
import type { ReportDateRange } from '../normalizeReportActivityDateRange';
import { buildCalendarDayKeys } from './buildCalendarDayKeys';
import {
  PRINT_PER_DAY_EMPTY_DAY_DISPLAY_MODE,
  type PrintPerDayEmptyDayDisplayMode,
} from './printPerDayEmptyDayDisplay';
import {
  formatDayHeading,
  formatDayRangeHeading,
} from './react/dateFormatters';
import type { PrintGroupedSectionDayBlock } from './react/PrintSectionTable';
import {
  toPrintRowViewModel,
  type PrintReportVariant,
  type PrintRowViewModel,
} from './react/rowViewModel';
import type { TranslationLanguageLabelResolver } from './react/translationLanguageDisplayLabels';

export interface BuildPrintGroupedDayBlocksOptions {
  activitiesByKey: Map<string, ReportActivityRow[]>;
  resolvedDateRange: ReportDateRange | null | undefined;
  showPerDayPrintChrome: boolean;
  emptyDayDisplayMode?: PrintPerDayEmptyDayDisplayMode;
  variant: PrintReportVariant;
  activityBaseUrl: string;
  resolveTranslationLanguageLabel?: TranslationLanguageLabelResolver;
}

function activityDayKeys(
  activitiesByKey: Map<string, ReportActivityRow[]>
): CalendarDateString[] {
  return [...activitiesByKey.keys()].sort() as CalendarDateString[];
}

function toRowViewModels(
  activities: ReportActivityRow[],
  options: Pick<
    BuildPrintGroupedDayBlocksOptions,
    'activityBaseUrl' | 'variant' | 'resolveTranslationLanguageLabel'
  >
): PrintRowViewModel[] {
  return activities.map((activity) =>
    toPrintRowViewModel(activity, {
      activityBaseUrl: options.activityBaseUrl,
      dateCellStyle: 'shortNoYear',
      variant: options.variant,
      resolveTranslationLanguageLabel: options.resolveTranslationLanguageLabel,
    })
  );
}

function emptyDayBlockKey(start: CalendarDateString, end: CalendarDateString) {
  return start === end ? start : `${start}..${end}`;
}

function pushEmptyDayBlock(
  blocks: PrintGroupedSectionDayBlock[],
  start: CalendarDateString,
  end: CalendarDateString
): void {
  blocks.push({
    dayKey: emptyDayBlockKey(start, end),
    dayHeading: formatDayRangeHeading(start, end),
    rows: [],
  });
}

function buildPerDayChromeDayBlocks(
  options: BuildPrintGroupedDayBlocksOptions
): PrintGroupedSectionDayBlock[] {
  const range = options.resolvedDateRange;
  if (!range?.start || !range?.end) {
    return activityDayKeys(options.activitiesByKey).map((dayKey) => ({
      dayKey,
      dayHeading: formatDayHeading(dayKey),
      rows: toRowViewModels(options.activitiesByKey.get(dayKey) ?? [], options),
    }));
  }

  const emptyDayMode =
    options.emptyDayDisplayMode ?? PRINT_PER_DAY_EMPTY_DAY_DISPLAY_MODE;
  const allDays = buildCalendarDayKeys({
    startDate: range.start,
    endDate: range.end,
  });
  const blocks: PrintGroupedSectionDayBlock[] = [];
  let emptyRunStart: CalendarDateString | null = null;
  let emptyRunEnd: CalendarDateString | null = null;

  const flushEmptyRun = () => {
    if (emptyRunStart == null || emptyRunEnd == null) return;
    pushEmptyDayBlock(blocks, emptyRunStart, emptyRunEnd);
    emptyRunStart = null;
    emptyRunEnd = null;
  };

  for (const dayKey of allDays) {
    const activities = options.activitiesByKey.get(dayKey) ?? [];
    if (activities.length > 0) {
      flushEmptyRun();
      blocks.push({
        dayKey,
        dayHeading: formatDayHeading(dayKey),
        rows: toRowViewModels(activities, options),
      });
      continue;
    }

    if (emptyDayMode === 'grouped') {
      if (emptyRunStart == null) {
        emptyRunStart = dayKey;
        emptyRunEnd = dayKey;
      } else {
        emptyRunEnd = dayKey;
      }
      continue;
    }

    pushEmptyDayBlock(blocks, dayKey, dayKey);
  }

  flushEmptyRun();
  return blocks;
}

/**
 * Builds ordered day blocks for {@link PrintGroupedSectionTable}.
 * Sections with per-day chrome include every day in `resolvedDateRange`;
 * empty days render a placeholder row (optionally grouped when consecutive).
 */
export function buildPrintGroupedDayBlocks(
  options: BuildPrintGroupedDayBlocksOptions
): PrintGroupedSectionDayBlock[] {
  if (options.showPerDayPrintChrome) {
    return buildPerDayChromeDayBlocks(options);
  }

  return activityDayKeys(options.activitiesByKey).map((dayKey) => ({
    dayKey,
    dayHeading: formatDayHeading(dayKey),
    rows: toRowViewModels(options.activitiesByKey.get(dayKey) ?? [], options),
  }));
}
