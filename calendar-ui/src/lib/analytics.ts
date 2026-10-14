// src/lib/analytics.ts
import type { ActivityFilterState } from '@corpcal/shared';
import { isReportBaselineDateRange } from '@/lib/report-filter-state';

type CalendarActionFilters = {
  from_date?: string | null;
  to_date?: string | null;
  this_day_only?: boolean | null;
  look_ahead_filter?: string | null;
  [key: string]: any;
};

type CalendarAction = {
  action: string;
  count?: number | null;
  filters?: CalendarActionFilters | null;
};

type ReportSearchSubmittedEvent = {
  report_name: string;
  search_present: boolean;
  search_length_bucket: 'none' | 'lt20' | 'lt100' | 'gte100';
  active_filter_count: number;
  timestamp_client: string;
  category_count?: number;
  status_count?: number;
  tag_count?: number;
  date_range_active?: boolean;
  date_confirmed_filter?: string;
  time_confirmed_filter?: string;
};

type ReportSearchResultsLoadedEvent = {
  report_name: string;
  results_count_bucket: '0' | '1' | '2to10' | '11to50' | 'gt50';
  latency_bucket_ms: 'lt250' | 'lt1000' | 'lt3000' | 'gte3000';
  search_present: boolean;
  page_number?: number;
  page_size?: number;
  active_filter_count?: number;
};

type ReportResultOpenedEvent = {
  report_name: string;
  item_type: string;
  position_in_results: number;
  results_count_bucket: '0' | '1' | '2to10' | '11to50' | 'gt50';
  open_method?: string;
  active_filter_count?: number;
};

type ReportSearchClearedEvent = {
  report_name: string;
  had_search_text: boolean;
  had_filters: boolean;
  active_filter_count_before_clear?: number;
};

type ReportFiltersAppliedEvent = {
  report_name: string;
  filter_keys_used: string[];
  active_filter_count: number;
  category_count?: number;
  status_count?: number;
  tag_count?: number;
  lead_team_count?: number;
};

type ReportNoResultsShownEvent = {
  report_name: string;
  active_filter_count: number;
  search_present: boolean;
  date_range_active?: boolean;
  filter_keys_used?: string[];
};

type ReportExportStartedEvent = {
  report_name: string;
  export_type: 'pdf' | 'csv' | 'xlsx';
  rows_bucket: '0' | '1' | '2to10' | '11to50' | 'gt50';
  active_filter_count?: number;
  search_present?: boolean;
};

type ReportExportCompletedEvent = {
  report_name: string;
  export_type: 'pdf' | 'csv' | 'xlsx';
  status: 'success' | 'failure';
  duration_bucket_ms: 'lt250' | 'lt1000' | 'lt3000' | 'gte3000';
  error_category?: string;
  retry_count?: number;
};

type SavedFilterActionEvent = {
  report_name: string;
  action:
    | 'apply'
    | 'create'
    | 'update'
    | 'delete'
    | 'duplicate'
    | 'set_default'
    | 'clear_default'
    | 'auto_apply_default';
  filter_complexity_bucket: 'low' | 'medium' | 'high';
  reuse_count_bucket?: '0' | '1' | '2to10' | '11to50' | 'gt50';
  age_bucket_days?: 'lt1' | '1to7' | '8to30' | 'gt30';
};

type ReportPaginationChangedEvent = {
  report_name: string;
  action: 'page_change' | 'page_size_change';
  page_number: number;
  page_size: number;
  total_pages: number;
  active_filter_count?: number;
  search_present?: boolean;
};

function hasSnowplow(): boolean {
  return typeof window !== 'undefined' && typeof window.snowplow === 'function';
}

function trackSelfDescribingEvent(
  schema: string,
  data: Record<string, unknown>
) {
  if (!hasSnowplow()) return;
  try {
    window.snowplow?.('trackSelfDescribingEvent', {
      schema,
      data,
    });
  } catch {
    // swallow analytics errors to avoid breaking the app
  }
}

export function bucketSearchLength(
  keyword: string | null | undefined
): 'none' | 'lt20' | 'lt100' | 'gte100' {
  const trimmedLength = keyword?.trim().length ?? 0;
  if (trimmedLength === 0) return 'none';
  if (trimmedLength < 20) return 'lt20';
  if (trimmedLength < 100) return 'lt100';
  return 'gte100';
}

export function bucketResultsCount(
  count: number
): '0' | '1' | '2to10' | '11to50' | 'gt50' {
  if (count <= 0) return '0';
  if (count === 1) return '1';
  if (count <= 10) return '2to10';
  if (count <= 50) return '11to50';
  return 'gt50';
}

export function bucketDurationMs(
  durationMs: number
): 'lt250' | 'lt1000' | 'lt3000' | 'gte3000' {
  if (durationMs < 250) return 'lt250';
  if (durationMs < 1000) return 'lt1000';
  if (durationMs < 3000) return 'lt3000';
  return 'gte3000';
}

export function bucketFilterComplexity(
  activeCriteriaCount: number
): 'low' | 'medium' | 'high' {
  if (activeCriteriaCount <= 2) return 'low';
  if (activeCriteriaCount <= 6) return 'medium';
  return 'high';
}

export function countActiveReportFilterCriteria(
  filterState: ActivityFilterState,
  reportName: string
): number {
  return getActiveReportFilterKeys(filterState, reportName).length;
}

export function getActiveReportFilterKeys(
  filterState: ActivityFilterState,
  reportName: string
): string[] {
  const activeKeys: string[] = [];

  if (!isReportBaselineDateRange(filterState.dateRange, reportName)) {
    activeKeys.push('dateRange');
  }

  if (filterState.pitchDateFilter.kind !== 'any') {
    activeKeys.push('pitchDateFilter');
  }

  for (const [key, value] of Object.entries(filterState)) {
    if (key === 'dateRange' || key === 'pitchDateFilter') continue;
    if (Array.isArray(value)) {
      if (value.length > 0) activeKeys.push(key);
      continue;
    }
    if (typeof value === 'boolean') {
      if (value) activeKeys.push(key);
      continue;
    }
    if (typeof value === 'string') {
      if (value !== '' && value !== 'any') activeKeys.push(key);
      continue;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      activeKeys.push(key);
    }
  }

  return activeKeys;
}

export function trackCalendarClick(action: string) {
  trackSelfDescribingEvent(
    'iglu:ca.bc.gov.bcs/calendar_click/jsonschema/1-0-0',
    {
      action,
    }
  );
}

export function trackCalendarAction(payload: CalendarAction) {
  const { action, count, filters } = payload;
  const eventData: any = { action };
  if (typeof count === 'number') eventData.count = count;
  if (filters && Object.keys(filters).length > 0) eventData.filters = filters;

  trackSelfDescribingEvent(
    'iglu:ca.bc.gov.bcs/calendar_action/jsonschema/1-0-0',
    eventData
  );
}

export function trackReportSearchSubmitted(
  payload: ReportSearchSubmittedEvent
) {
  trackSelfDescribingEvent(
    'iglu:ca.bc.gov.bcs/report_search_submitted/jsonschema/1-0-0',
    payload
  );
}

export function trackReportSearchResultsLoaded(
  payload: Omit<
    ReportSearchResultsLoadedEvent,
    'results_count_bucket' | 'latency_bucket_ms'
  > & {
    results_count: number;
    latency_ms: number;
  }
) {
  const { results_count, latency_ms, ...rest } = payload;
  trackSelfDescribingEvent(
    'iglu:ca.bc.gov.bcs/report_search_results_loaded/jsonschema/1-0-0',
    {
      ...rest,
      results_count_bucket: bucketResultsCount(results_count),
      latency_bucket_ms: bucketDurationMs(latency_ms),
    }
  );
}

export function trackReportResultOpened(
  payload: Omit<ReportResultOpenedEvent, 'results_count_bucket'> & {
    results_count: number;
  }
) {
  const { results_count, ...rest } = payload;
  trackSelfDescribingEvent(
    'iglu:ca.bc.gov.bcs/report_result_opened/jsonschema/1-0-0',
    {
      ...rest,
      results_count_bucket: bucketResultsCount(results_count),
    }
  );
}

export function trackReportSearchCleared(payload: ReportSearchClearedEvent) {
  trackSelfDescribingEvent(
    'iglu:ca.bc.gov.bcs/report_search_cleared/jsonschema/1-0-0',
    payload
  );
}

export function trackReportFiltersApplied(payload: ReportFiltersAppliedEvent) {
  trackSelfDescribingEvent(
    'iglu:ca.bc.gov.bcs/report_filters_applied/jsonschema/1-0-0',
    payload
  );
}

export function trackReportNoResultsShown(payload: ReportNoResultsShownEvent) {
  trackSelfDescribingEvent(
    'iglu:ca.bc.gov.bcs/report_no_results_shown/jsonschema/1-0-0',
    payload
  );
}

export function trackReportExportStarted(
  payload: Omit<ReportExportStartedEvent, 'rows_bucket'> & {
    rows_count: number;
  }
) {
  const { rows_count, ...rest } = payload;
  trackSelfDescribingEvent(
    'iglu:ca.bc.gov.bcs/report_export_started/jsonschema/1-0-0',
    {
      ...rest,
      rows_bucket: bucketResultsCount(rows_count),
    }
  );
}

export function trackReportExportCompleted(
  payload: Omit<ReportExportCompletedEvent, 'duration_bucket_ms'> & {
    duration_ms: number;
  }
) {
  const { duration_ms, ...rest } = payload;
  trackSelfDescribingEvent(
    'iglu:ca.bc.gov.bcs/report_export_completed/jsonschema/1-0-0',
    {
      ...rest,
      duration_bucket_ms: bucketDurationMs(duration_ms),
    }
  );
}

export function trackSavedFilterAction(payload: SavedFilterActionEvent) {
  trackSelfDescribingEvent(
    'iglu:ca.bc.gov.bcs/saved_filter_action/jsonschema/1-0-0',
    payload
  );
}

export function trackReportPaginationChanged(
  payload: ReportPaginationChangedEvent
) {
  trackSelfDescribingEvent(
    'iglu:ca.bc.gov.bcs/report_pagination_changed/jsonschema/1-0-0',
    payload
  );
}

export default {
  bucketDurationMs,
  bucketFilterComplexity,
  bucketResultsCount,
  bucketSearchLength,
  countActiveReportFilterCriteria,
  getActiveReportFilterKeys,
  trackCalendarClick,
  trackCalendarAction,
  trackReportExportCompleted,
  trackReportExportStarted,
  trackReportFiltersApplied,
  trackReportNoResultsShown,
  trackReportPaginationChanged,
  trackReportResultOpened,
  trackReportSearchCleared,
  trackReportSearchResultsLoaded,
  trackReportSearchSubmitted,
  trackSavedFilterAction,
};
