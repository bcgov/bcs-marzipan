import {
  DEFAULT_ACTIVITY_FILTER_STATE,
  type ActivityFilterState,
  type DateRangeValue,
} from '@corpcal/shared';
import {
  defaultLookAheadCuratedDateRange,
  type LookAheadCuratedPresetId,
} from '@corpcal/shared/reports/look-ahead';

export const LOOK_AHEAD_PAGE_PREFERENCES_KEY = 'lookAheadPagePreferences';

export interface LookAheadPagePreferences {
  filterState: ActivityFilterState;
  searchKeyword: string;
  execMode: boolean;
  filtersExpanded: boolean;
  /** Last matched curated preset, if any; used to re-apply after Pacific midnight. */
  activeCuratedPreset: LookAheadCuratedPresetId | null;
}

function buildDefaultDateRange(): DateRangeValue {
  const preset = defaultLookAheadCuratedDateRange();
  return {
    startDate: preset.start,
    endDate: preset.end,
    noStartDate: false,
    noEndDate: false,
  };
}

export function buildDefaultLookAheadPagePreferences(): LookAheadPagePreferences {
  return {
    searchKeyword: '',
    execMode: false,
    filtersExpanded: false,
    activeCuratedPreset: 'today',
    filterState: {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      dateRange: buildDefaultDateRange(),
      categoryIds: [],
      leadTeamIds: [],
    },
  };
}

export function loadLookAheadPagePreferences(): LookAheadPagePreferences {
  if (typeof sessionStorage === 'undefined') {
    return buildDefaultLookAheadPagePreferences();
  }
  try {
    const raw = sessionStorage.getItem(LOOK_AHEAD_PAGE_PREFERENCES_KEY);
    if (!raw) return buildDefaultLookAheadPagePreferences();
    const parsed = JSON.parse(raw) as Partial<LookAheadPagePreferences>;
    const defaults = buildDefaultLookAheadPagePreferences();
    return {
      ...defaults,
      ...parsed,
      filterState: {
        ...defaults.filterState,
        ...parsed.filterState,
        dateRange: {
          ...defaults.filterState.dateRange,
          ...parsed.filterState?.dateRange,
        },
      },
    };
  } catch {
    return buildDefaultLookAheadPagePreferences();
  }
}

export function saveLookAheadPagePreferences(prefs: LookAheadPagePreferences) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(
      LOOK_AHEAD_PAGE_PREFERENCES_KEY,
      JSON.stringify(prefs)
    );
  } catch {
    /* private mode */
  }
}

export function clearLookAheadCuratedFilters(
  prefs: LookAheadPagePreferences
): LookAheadPagePreferences {
  return {
    ...prefs,
    searchKeyword: '',
    filterState: {
      ...prefs.filterState,
      categoryIds: [],
      leadTeamIds: [],
    },
  };
}
