import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { activityFilterStateToQueryParams, PERMISSIONS } from '@corpcal/shared';
import type { LookAheadCuratedPresetId } from '@corpcal/shared/reports/look-ahead';
import { fetchReportData } from '@/api/reportsApi';
import { PageHeader } from '@/components/layout';
import { LookAheadCuratedFilters } from '@/components/look-ahead/LookAheadCuratedFilters';
import { LookAheadDateRangeControl } from '@/components/look-ahead/LookAheadDateRangeControl';
import { LookAheadSectionToc } from '@/components/look-ahead/LookAheadSectionToc';
import { PrintReportPreview } from '@/components/reports/PrintReportPreview';
import { StatusMessage } from '@/components/shared';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useAutoHideHeader } from '@/hooks/useAutoHideHeader';
import { useActivityStatuses } from '@/hooks/useLookups';
import { useReportDataFreshness } from '@/hooks/useReportDataFreshness';
import analytics from '@/lib/analytics';
import {
  clearLookAheadCuratedFilters,
  loadLookAheadPagePreferences,
  saveLookAheadPagePreferences,
  type LookAheadPagePreferences,
} from '@/lib/lookAheadPagePreferences';
import { stableSerializeReportQueryParams } from '@/lib/report-query-params';
import { filterReportDataBySearchKeyword } from '@/lib/report-search-filter';
import { reportQueryKeys } from '@/lib/reportQueryKeys';
import { URL_PARAM_REPORT } from '@/lib/reportsTablePreferencesParams';
import { cn } from '@/lib/utils';

export function LookAheadPage() {
  const { hasPermission } = useAuth();
  const canExec = hasPermission(PERMISSIONS.LOOK_AHEAD.EXEC_VIEW);
  const canOpenReports = hasPermission(PERMISSIONS.REPORTS.VIEW);
  const headerVisible = useAutoHideHeader();

  const [preferences, setPreferences] = useState<LookAheadPagePreferences>(() =>
    loadLookAheadPagePreferences()
  );

  useEffect(() => {
    saveLookAheadPagePreferences(preferences);
  }, [preferences]);

  const activeReport = preferences.execMode && canExec ? 'exec' : 'look-ahead';

  const { data: activityStatusesForFilter = [] } = useActivityStatuses();
  const statusArchiveIds = useMemo(() => {
    const completed = activityStatusesForFilter.find(
      (s) => s.name === 'completed'
    );
    const deleted = activityStatusesForFilter.find((s) => s.name === 'deleted');
    return {
      completedStatusId: completed?.id,
      deletedStatusId: deleted?.id,
    };
  }, [activityStatusesForFilter]);

  const reportFetchParams = useMemo(
    () =>
      activityFilterStateToQueryParams(
        {
          filterState: preferences.filterState,
          showCompleted: false,
          showDeleted: false,
        },
        statusArchiveIds,
        false
      ),
    [preferences.filterState, statusArchiveIds]
  );

  const reportFetchParamsKey = useMemo(
    () => stableSerializeReportQueryParams(reportFetchParams),
    [reportFetchParams]
  );

  const {
    data,
    isLoading,
    isFetching,
    isPlaceholderData,
    error,
    dataUpdatedAt,
  } = useQuery({
    queryKey: reportQueryKeys.data(activeReport, reportFetchParamsKey),
    queryFn: () => fetchReportData(activeReport, reportFetchParams),
    placeholderData: (previousData) => previousData,
  });

  const displayData = useMemo(
    () => filterReportDataBySearchKeyword(data, preferences.searchKeyword),
    [data, preferences.searchKeyword]
  );

  const { isFresh, isWrongReport, isPreviewLoading } = useReportDataFreshness({
    activeReport,
    displayData,
    isPlaceholderData,
    isLoading,
    hasData: !!data,
  });

  const setPartialPreferences = useCallback(
    (partial: Partial<LookAheadPagePreferences>) => {
      setPreferences((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const handleDateRangeChange = useCallback(
    (
      dateRange: LookAheadPagePreferences['filterState']['dateRange'],
      activePreset: LookAheadCuratedPresetId | null
    ) => {
      setPreferences((prev) => ({
        ...prev,
        activeCuratedPreset: activePreset,
        filterState: {
          ...prev.filterState,
          dateRange,
        },
      }));
    },
    []
  );

  const handlePresetApplied = useCallback(
    (preset: LookAheadCuratedPresetId | 'custom') => {
      analytics.trackLookAheadCuratedEvent({
        event: 'date_preset',
        report_name: activeReport,
        date_preset: preset,
      });
    },
    [activeReport]
  );

  const handleResetCuratedFilters = useCallback(() => {
    setPreferences((prev) => clearLookAheadCuratedFilters(prev));
  }, []);

  const reportsDeepLink = useMemo(() => {
    const params = new URLSearchParams();
    params.set(URL_PARAM_REPORT, activeReport);
    if (preferences.filterState.dateRange.startDate) {
      params.set('dateFrom', preferences.filterState.dateRange.startDate);
    }
    if (preferences.filterState.dateRange.endDate) {
      params.set('dateTo', preferences.filterState.dateRange.endDate);
    }
    return `/reports?${params.toString()}`;
  }, [activeReport, preferences.filterState.dateRange]);

  if (error) {
    return (
      <StatusMessage
        title="Error loading Look Ahead"
        message={
          error instanceof Error ? error.message : 'Failed to load report data'
        }
        variant="error"
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-col pb-12">
      <div
        className={cn(
          'bg-background border-border sticky top-0 z-30 border-b pb-3 transition-transform duration-200',
          !headerVisible && '-translate-y-full border-transparent'
        )}
      >
        <PageHeader
          title="Look Ahead"
          action={
            <div className="flex flex-wrap items-center gap-4">
              <LookAheadDateRangeControl
                dateRange={preferences.filterState.dateRange}
                activePreset={preferences.activeCuratedPreset}
                onDateRangeChange={handleDateRangeChange}
                onPresetApplied={handlePresetApplied}
              />
              {canExec ? (
                <div className="flex items-center gap-2">
                  <Switch
                    id="look-ahead-exec-detail"
                    checked={preferences.execMode}
                    onCheckedChange={(checked) =>
                      setPartialPreferences({ execMode: checked })
                    }
                    aria-label="Exec detail view"
                  />
                  <Label htmlFor="look-ahead-exec-detail" className="text-sm">
                    Exec detail
                  </Label>
                </div>
              ) : null}
              {canOpenReports ? (
                <Link
                  to={reportsDeepLink}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Open in Reports
                </Link>
              ) : null}
              {dataUpdatedAt ? (
                <span className="text-muted-foreground text-xs">
                  Updated{' '}
                  {new Date(dataUpdatedAt).toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              ) : null}
            </div>
          }
          className="mb-2"
        />

        <LookAheadCuratedFilters
          expanded={preferences.filtersExpanded}
          onExpandedChange={(filtersExpanded) =>
            setPartialPreferences({ filtersExpanded })
          }
          searchKeyword={preferences.searchKeyword}
          onSearchKeywordChange={(searchKeyword) =>
            setPartialPreferences({ searchKeyword })
          }
          filterState={preferences.filterState}
          onFilterStateChange={(filterState) =>
            setPartialPreferences({ filterState })
          }
          onResetCuratedFilters={handleResetCuratedFilters}
        />
      </div>

      <div className="flex min-w-0 gap-6 lg:gap-8">
        <LookAheadSectionToc
          displayData={displayData ?? undefined}
          isLoading={isPreviewLoading}
          isFresh={isFresh && !isWrongReport}
        />

        <PreviewColumn
          className={cn(
            'min-w-0 flex-1',
            isFetching && !isPreviewLoading && 'opacity-[0.98]'
          )}
        >
          {isPreviewLoading ? (
            <p className="text-muted-foreground py-12 text-center">
              Loading report…
            </p>
          ) : displayData ? (
            <div
              className="report-print-preview-root px-2 pb-8 md:px-4"
              style={
                {
                  '--corpcal-print-root-max-width': 'none',
                } as CSSProperties
              }
            >
              <PrintReportPreview
                reportTypeName={activeReport}
                data={displayData}
                sectionAnchorIds
              />
            </div>
          ) : (
            <p className="text-muted-foreground py-12 text-center">
              No activities in the selected range.
            </p>
          )}
        </PreviewColumn>
      </div>
    </div>
  );
}

function PreviewColumn({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={className}>{children}</div>;
}
