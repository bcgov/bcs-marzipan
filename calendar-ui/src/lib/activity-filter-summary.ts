import { format } from 'date-fns';

import type { ActivityFilterState } from '@corpcal/shared';
import {
  isDateRangeActive,
  type DateRangeValue,
} from '@/components/activity/ActivityTable/ScheduledDateRangeFields';
import { getLookAheadStatusLabel } from '@/constants/form-options';
import type { OptionItem } from '@/schemas/types';

export type ActivityFilterSummaryLine = { label: string; value: string };

/** One removable chip (single filter value). */
export type ActivityFilterChip = {
  chipKey: string;
  displayLabel: string;
};

/** One row: filter type label + chips for each value in that type. */
export type ActivityFilterChipRow = {
  rowKey: string;
  label: string;
  chips: ActivityFilterChip[];
};

/** Options needed to resolve stored IDs to labels in filter summaries. */
export type ActivityFilterSummaryContext = {
  statusOptions: OptionItem[];
  categoryOptions?: OptionItem[];
  pitchRequiredStatusOptions: OptionItem[];
  tagOptions: OptionItem[];
  ministryOptions: OptionItem[];
  organizationOptions: OptionItem[];
  commsContactOptions: OptionItem[];
  eventPlannerOptions: OptionItem[];
  teamOptions: OptionItem[];
  translationStatusOptions: OptionItem[];
  translationOptions: OptionItem[];
  /**
   * Resolve a stored `lookAheadSection` bucket key to its short UI label.
   * Driven by `useLookAheadSectionRows` so chip labels stay in sync with the
   * radio/filter UIs. Falls back to the raw key when the lookup is missing or
   * the key is no longer in the active config.
   */
  getLookAheadSectionLabel?: (value: string) => string;
};

const EMPTY_DATE_RANGE: ActivityFilterState['dateRange'] = {
  startDate: '',
  endDate: '',
  noStartDate: false,
  noEndDate: false,
};

function formatDateRangeValue(dr: DateRangeValue): string {
  const startPart = dr.noStartDate
    ? 'No start date'
    : dr.startDate
      ? format(new Date(`${dr.startDate}T12:00:00`), 'MMM d, yyyy')
      : 'No start date';
  const endPart = dr.noEndDate
    ? 'No end date'
    : dr.endDate
      ? format(new Date(`${dr.endDate}T12:00:00`), 'MMM d, yyyy')
      : 'No end date';
  return `${startPart} – ${endPart}`;
}

function labelForNumericId(id: number, options: OptionItem[]): string {
  const map = new Map<number, string>();
  for (const o of options) {
    const n = parseInt(o.value, 10);
    if (Number.isFinite(n)) map.set(n, o.label);
  }
  return map.get(id) ?? `ID ${id}`;
}

function pitchDateSummary(
  pitchDateFilter: ActivityFilterState['pitchDateFilter']
): string {
  if (pitchDateFilter.kind === 'any') return '';
  if (pitchDateFilter.kind === 'not_scheduled') {
    return 'Not scheduled for panel';
  }
  if (!isDateRangeActive(pitchDateFilter.dateRange)) {
    return 'Scheduled for panel';
  }
  return `Scheduled for panel — ${formatDateRangeValue(pitchDateFilter.dateRange)}`;
}

function confirmedLabel(
  v: ActivityFilterState['dateConfirmedFilter']
): string | null {
  if (v === 'confirmed') return 'Confirmed';
  if (v === 'not_confirmed') return 'Not confirmed';
  return null;
}

/**
 * Rows of filter types with one chip per selected value (for saved-filter dialogs).
 */
export function buildActivityFilterChipRows(
  filterState: ActivityFilterState,
  searchKeyword: string,
  ctx: ActivityFilterSummaryContext
): ActivityFilterChipRow[] {
  const rows: ActivityFilterChipRow[] = [];
  const kw = searchKeyword.trim();
  if (kw) {
    rows.push({
      rowKey: 'search',
      label: 'Search',
      chips: [{ chipKey: 'search', displayLabel: kw }],
    });
  }

  const dr = filterState.dateRange;
  if (
    dr.startDate !== '' ||
    dr.endDate !== '' ||
    dr.noStartDate ||
    dr.noEndDate
  ) {
    rows.push({
      rowKey: 'dateRange',
      label: 'Date',
      chips: [{ chipKey: 'dateRange', displayLabel: formatDateRangeValue(dr) }],
    });
  }

  if (filterState.categoryIds.length > 0) {
    rows.push({
      rowKey: 'category',
      label: 'Category',
      chips: filterState.categoryIds.map((id) => ({
        chipKey: `category:${id}`,
        displayLabel: labelForNumericId(id, ctx.categoryOptions ?? []),
      })),
    });
  }

  if (filterState.leadMinistryIds.length > 0) {
    rows.push({
      rowKey: 'leadMinistry',
      label: 'Ministry',
      chips: filterState.leadMinistryIds.map((id) => ({
        chipKey: `leadMinistry:${id}`,
        displayLabel: labelForNumericId(id, ctx.ministryOptions),
      })),
    });
  }

  if (filterState.commsContactLeadUserIds.length > 0) {
    rows.push({
      rowKey: 'commsContact',
      label: 'Comms contact',
      chips: filterState.commsContactLeadUserIds.map((id) => ({
        chipKey: `comms:${id}`,
        displayLabel: labelForNumericId(id, ctx.commsContactOptions),
      })),
    });
  }

  if (filterState.activityStatusIds.length > 0) {
    rows.push({
      rowKey: 'status',
      label: 'Status',
      chips: filterState.activityStatusIds.map((id) => ({
        chipKey: `status:${id}`,
        displayLabel: labelForNumericId(id, ctx.statusOptions),
      })),
    });
  }

  if (filterState.pitchRequiredStatusNames.length > 0) {
    const byValue = new Map(
      ctx.pitchRequiredStatusOptions.map((o) => [o.value, o.label])
    );
    rows.push({
      rowKey: 'pitchStatus',
      label: 'Pitch status',
      chips: filterState.pitchRequiredStatusNames.map((name) => ({
        chipKey: `pitchStatus:${encodeURIComponent(name)}`,
        displayLabel: byValue.get(name) ?? name,
      })),
    });
  }

  if (filterState.pitchDateFilter.kind !== 'any') {
    rows.push({
      rowKey: 'pitchDate',
      label: 'Pitch date',
      chips: [
        {
          chipKey: 'pitchDate',
          displayLabel: pitchDateSummary(filterState.pitchDateFilter),
        },
      ],
    });
  }

  if (filterState.lookAheadStatusValues.length > 0) {
    rows.push({
      rowKey: 'lookAheadStatus',
      label: 'LA status',
      chips: filterState.lookAheadStatusValues.map((v) => ({
        chipKey: `laStatus:${encodeURIComponent(v)}`,
        displayLabel: getLookAheadStatusLabel(v),
      })),
    });
  }

  if (filterState.lookAheadSectionValues.length > 0) {
    const resolveSectionLabel =
      ctx.getLookAheadSectionLabel ?? ((v: string) => v);
    rows.push({
      rowKey: 'lookAheadSection',
      label: 'LA section',
      chips: filterState.lookAheadSectionValues.map((v) => ({
        chipKey: `laSection:${encodeURIComponent(v)}`,
        displayLabel: resolveSectionLabel(v),
      })),
    });
  }

  const dateStatus = confirmedLabel(filterState.dateConfirmedFilter);
  if (dateStatus) {
    rows.push({
      rowKey: 'dateConfirmed',
      label: 'Date status',
      chips: [{ chipKey: 'dateConfirmed', displayLabel: dateStatus }],
    });
  }

  const timeStatus = confirmedLabel(filterState.timeConfirmedFilter);
  if (timeStatus) {
    rows.push({
      rowKey: 'timeConfirmed',
      label: 'Time status',
      chips: [{ chipKey: 'timeConfirmed', displayLabel: timeStatus }],
    });
  }

  if (filterState.tagIds.length > 0) {
    rows.push({
      rowKey: 'tags',
      label: 'Tags',
      chips: filterState.tagIds.map((id) => ({
        chipKey: `tag:${id}`,
        displayLabel: labelForNumericId(id, ctx.tagOptions),
      })),
    });
  }

  if (filterState.translationRequiredStatusIds.length > 0) {
    rows.push({
      rowKey: 'translationStatus',
      label: 'Translations status',
      chips: filterState.translationRequiredStatusIds.map((id) => ({
        chipKey: `translationStatus:${id}`,
        displayLabel: labelForNumericId(id, ctx.translationStatusOptions),
      })),
    });
  }

  if (filterState.translationLanguageIds.length > 0) {
    rows.push({
      rowKey: 'languages',
      label: 'Languages',
      chips: filterState.translationLanguageIds.map((id) => ({
        chipKey: `language:${id}`,
        displayLabel: labelForNumericId(id, ctx.translationOptions),
      })),
    });
  }

  if ((filterState.leadTeamIds ?? []).length > 0) {
    rows.push({
      rowKey: 'team',
      label: 'Team',
      chips: (filterState.leadTeamIds ?? []).map((id) => ({
        chipKey: `team:${id}`,
        displayLabel: labelForNumericId(id, ctx.teamOptions),
      })),
    });
  }

  if (filterState.leadOrgIds.length > 0) {
    rows.push({
      rowKey: 'leadOrganization',
      label: 'Organization',
      chips: filterState.leadOrgIds.map((id) => ({
        chipKey: `leadOrg:${id}`,
        displayLabel: labelForNumericId(id, ctx.organizationOptions),
      })),
    });
  }

  if (filterState.eventPlannerLeadIds.length > 0) {
    rows.push({
      rowKey: 'eventPlanner',
      label: 'Event planner',
      chips: filterState.eventPlannerLeadIds.map((id) => ({
        chipKey: `eventPlanner:${id}`,
        displayLabel: labelForNumericId(id, ctx.eventPlannerOptions),
      })),
    });
  }

  return rows;
}

/** Strip trailing colon from chip row labels for inline summary text. */
function filterTypeLabelForSummaryBar(raw: string): string {
  return raw.endsWith(':') ? raw.slice(0, -1) : raw;
}

/**
 * Short label per active filter dimension (e.g. table summary “(filtering by: …)”).
 * Order matches {@link buildActivityFilterChipRows}.
 */
export function getAppliedActivityFilterTypeLabels(
  filterState: ActivityFilterState,
  searchKeyword: string,
  ctx: ActivityFilterSummaryContext
): string[] {
  return buildActivityFilterChipRows(filterState, searchKeyword, ctx).map(
    (row) => filterTypeLabelForSummaryBar(row.label)
  );
}

/**
 * Builds human-readable lines for the filters that are currently active.
 * Omits dimensions that match the default (no filter).
 */
export function buildActivityFilterSummaryLines(
  filterState: ActivityFilterState,
  searchKeyword: string,
  ctx: ActivityFilterSummaryContext
): ActivityFilterSummaryLine[] {
  return buildActivityFilterChipRows(filterState, searchKeyword, ctx).map(
    (row) => ({
      label: row.label,
      value: row.chips.map((c) => c.displayLabel).join(', '),
    })
  );
}

/** Max values listed per filter row in the activity table summary detail popover; extra values become “+n more”. */
export const ACTIVITY_FILTER_DETAIL_POPOVER_MAX_VALUES_PER_ROW = 8;

/**
 * Like {@link buildActivityFilterSummaryLines}, but caps how many chip values are shown per row
 * for dense multi-select fields (tags, statuses, etc.).
 */
export function buildActivityFilterSummaryLinesForDetailPopover(
  filterState: ActivityFilterState,
  searchKeyword: string,
  ctx: ActivityFilterSummaryContext,
  maxValuesPerRow: number = ACTIVITY_FILTER_DETAIL_POPOVER_MAX_VALUES_PER_ROW
): ActivityFilterSummaryLine[] {
  return buildActivityFilterChipRows(filterState, searchKeyword, ctx).map(
    (row) => {
      const labels = row.chips.map((c) => c.displayLabel);
      if (labels.length <= maxValuesPerRow) {
        return { label: row.label, value: labels.join(', ') };
      }
      const head = labels.slice(0, maxValuesPerRow);
      const more = labels.length - maxValuesPerRow;
      return {
        label: row.label,
        value: `${head.join(', ')}, +${more} more`,
      };
    }
  );
}

/**
 * Removes a single chip value from filter state.
 */
export function clearSavedFilterChip(
  chipKey: string,
  state: ActivityFilterState,
  searchKeyword: string
): { filterState: ActivityFilterState; searchKeyword: string } {
  const kw = searchKeyword;
  if (chipKey === 'search') {
    return { filterState: state, searchKeyword: '' };
  }
  if (chipKey === 'dateRange') {
    return {
      filterState: { ...state, dateRange: { ...EMPTY_DATE_RANGE } },
      searchKeyword: kw,
    };
  }
  if (chipKey === 'pitchDate') {
    return {
      filterState: { ...state, pitchDateFilter: { kind: 'any' } },
      searchKeyword: kw,
    };
  }
  if (chipKey === 'dateConfirmed') {
    return {
      filterState: { ...state, dateConfirmedFilter: 'any' },
      searchKeyword: kw,
    };
  }
  if (chipKey === 'timeConfirmed') {
    return {
      filterState: { ...state, timeConfirmedFilter: 'any' },
      searchKeyword: kw,
    };
  }

  const i = chipKey.indexOf(':');
  if (i === -1) {
    return { filterState: state, searchKeyword: kw };
  }
  const prefix = chipKey.slice(0, i);
  const raw = chipKey.slice(i + 1);

  switch (prefix) {
    case 'category': {
      const id = parseInt(raw, 10);
      if (!Number.isFinite(id))
        return { filterState: state, searchKeyword: kw };
      return {
        filterState: {
          ...state,
          categoryIds: state.categoryIds.filter((x) => x !== id),
        },
        searchKeyword: kw,
      };
    }
    case 'status': {
      const id = parseInt(raw, 10);
      if (!Number.isFinite(id))
        return { filterState: state, searchKeyword: kw };
      return {
        filterState: {
          ...state,
          activityStatusIds: state.activityStatusIds.filter((x) => x !== id),
        },
        searchKeyword: kw,
      };
    }
    case 'pitchStatus': {
      const name = decodeURIComponent(raw);
      return {
        filterState: {
          ...state,
          pitchRequiredStatusNames: state.pitchRequiredStatusNames.filter(
            (x) => x !== name
          ),
        },
        searchKeyword: kw,
      };
    }
    case 'laStatus': {
      const value = decodeURIComponent(raw);
      return {
        filterState: {
          ...state,
          lookAheadStatusValues: state.lookAheadStatusValues.filter(
            (x) => x !== value
          ),
        },
        searchKeyword: kw,
      };
    }
    case 'laSection': {
      const value = decodeURIComponent(raw);
      return {
        filterState: {
          ...state,
          lookAheadSectionValues: state.lookAheadSectionValues.filter(
            (x) => x !== value
          ),
        },
        searchKeyword: kw,
      };
    }
    case 'tag': {
      const id = parseInt(raw, 10);
      if (!Number.isFinite(id))
        return { filterState: state, searchKeyword: kw };
      return {
        filterState: {
          ...state,
          tagIds: state.tagIds.filter((x) => x !== id),
        },
        searchKeyword: kw,
      };
    }
    case 'translationStatus': {
      const id = parseInt(raw, 10);
      if (!Number.isFinite(id))
        return { filterState: state, searchKeyword: kw };
      return {
        filterState: {
          ...state,
          translationRequiredStatusIds:
            state.translationRequiredStatusIds.filter((x) => x !== id),
        },
        searchKeyword: kw,
      };
    }
    case 'language': {
      const id = parseInt(raw, 10);
      if (!Number.isFinite(id))
        return { filterState: state, searchKeyword: kw };
      return {
        filterState: {
          ...state,
          translationLanguageIds: state.translationLanguageIds.filter(
            (x) => x !== id
          ),
        },
        searchKeyword: kw,
      };
    }
    case 'leadMinistry': {
      const id = parseInt(raw, 10);
      if (!Number.isFinite(id))
        return { filterState: state, searchKeyword: kw };
      return {
        filterState: {
          ...state,
          leadMinistryIds: state.leadMinistryIds.filter((x) => x !== id),
        },
        searchKeyword: kw,
      };
    }
    case 'leadOrg': {
      const id = parseInt(raw, 10);
      if (!Number.isFinite(id))
        return { filterState: state, searchKeyword: kw };
      return {
        filterState: {
          ...state,
          leadOrgIds: state.leadOrgIds.filter((x) => x !== id),
        },
        searchKeyword: kw,
      };
    }
    case 'comms': {
      const id = parseInt(raw, 10);
      if (!Number.isFinite(id))
        return { filterState: state, searchKeyword: kw };
      return {
        filterState: {
          ...state,
          commsContactLeadUserIds: state.commsContactLeadUserIds.filter(
            (x) => x !== id
          ),
        },
        searchKeyword: kw,
      };
    }
    case 'eventPlanner': {
      const id = parseInt(raw, 10);
      if (!Number.isFinite(id))
        return { filterState: state, searchKeyword: kw };
      return {
        filterState: {
          ...state,
          eventPlannerLeadIds: state.eventPlannerLeadIds.filter(
            (x) => x !== id
          ),
        },
        searchKeyword: kw,
      };
    }
    case 'team': {
      const id = parseInt(raw, 10);
      if (!Number.isFinite(id))
        return { filterState: state, searchKeyword: kw };
      return {
        filterState: {
          ...state,
          leadTeamIds: (state.leadTeamIds ?? []).filter((x) => x !== id),
        },
        searchKeyword: kw,
      };
    }
    default:
      return { filterState: state, searchKeyword: kw };
  }
}
