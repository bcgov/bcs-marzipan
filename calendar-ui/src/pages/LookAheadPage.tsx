import { useQuery } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { activityFilterStateToQueryParams, PERMISSIONS } from '@corpcal/shared';
import type { LookAheadCuratedPresetId } from '@corpcal/shared/reports/look-ahead';
import { fetchReportData } from '@/api/reportsApi';
import { PageHeader } from '@/components/layout';
import { LookAheadCuratedFilters } from '@/components/look-ahead/LookAheadCuratedFilters';
import { LookAheadDateRangeControl } from '@/components/look-ahead/LookAheadDateRangeControl';
import { LookAheadSectionToc } from '@/components/look-ahead/LookAheadSectionToc';
import { PrintReportPreview } from '@/components/reports/PrintReportPreview';
import {
  ActivityConnectionStatusAlert,
  StatusMessage,
} from '@/components/shared';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useAutoHideHeader } from '@/hooks/useAutoHideHeader';
import { useLiveSyncConnectionAlert } from '@/hooks/useLiveSyncConnectionAlert';
import { useActivityStatuses } from '@/hooks/useLookups';
import { useReportDataFreshness } from '@/hooks/useReportDataFreshness';
import analytics from '@/lib/analytics';
import {
  clearLookAheadCuratedFilters,
  loadLookAheadPagePreferences,
  sanitizeLookAheadPagePreferences,
  saveLookAheadPagePreferences,
  type LookAheadPagePreferences,
} from '@/lib/lookAheadPagePreferences';
import { stableSerializeReportQueryParams } from '@/lib/report-query-params';
import { filterReportDataBySearchKeyword } from '@/lib/report-search-filter';
import { reportQueryKeys } from '@/lib/reportQueryKeys';
import { cn } from '@/lib/utils';

export function LookAheadPage() {
  const { hasPermission } = useAuth();
  const canExec = hasPermission(PERMISSIONS.LOOK_AHEAD.EXEC_VIEW);
  const canUsePublishedRange = hasPermission(
    PERMISSIONS.REPORTS.PUBLISHED_LOOK_AHEAD_RANGE
  );
  const headerVisible = useAutoHideHeader();
  const liveSyncConnectionAlert = useLiveSyncConnectionAlert();
  const stickyChromeRef = useRef<HTMLDivElement>(null);
  const [stickyChromeHeightPx, setStickyChromeHeightPx] = useState(0);

  const [preferences, setPreferences] = useState<LookAheadPagePreferences>(() =>
    loadLookAheadPagePreferences()
  );

  useEffect(() => {
    setPreferences((prev) => {
      const next = sanitizeLookAheadPagePreferences(prev, {
        canExec,
        canUsePublishedRange,
      });
      return next === prev ? prev : next;
    });
  }, [canExec, canUsePublishedRange]);

  useEffect(() => {
    saveLookAheadPagePreferences(preferences);
  }, [preferences]);

  useLayoutEffect(() => {
    const el = stickyChromeRef.current;
    if (!el) return;
    const syncHeight = () => setStickyChromeHeightPx(el.offsetHeight);
    syncHeight();
    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(syncHeight)
        : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [preferences.filtersExpanded, headerVisible]);

  const sectionScrollMarginPx = stickyChromeHeightPx + 8;

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
      <ActivityConnectionStatusAlert display={liveSyncConnectionAlert} />

      <div
        ref={stickyChromeRef}
        className={cn(
          'bg-background border-border sticky top-0 z-30 overflow-hidden border-b transition-[max-height] duration-200 ease-in-out motion-reduce:transition-none',
          headerVisible
            ? 'max-h-[48rem] pb-3'
            : 'max-h-0 border-transparent pb-0'
        )}
      >
        <PageHeader
          title="Look Ahead"
          titleAddon={
            <LookAheadDateRangeControl
              dateRange={preferences.filterState.dateRange}
              activePreset={preferences.activeCuratedPreset}
              onDateRangeChange={handleDateRangeChange}
              onPresetApplied={handlePresetApplied}
            />
          }
          action={
            dataUpdatedAt ? (
              <span className="text-muted-foreground text-xs">
                Refreshed at{' '}
                {new Date(dataUpdatedAt).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            ) : undefined
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
          trailingContent={
            canExec ? (
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
            ) : undefined
          }
        />
      </div>

      <div
        className="flex min-w-0 items-start gap-6 lg:gap-8"
        style={
          {
            '--look-ahead-toc-sticky-offset':
              stickyChromeHeightPx > 0
                ? `${sectionScrollMarginPx}px`
                : undefined,
          } as CSSProperties
        }
      >
        <LookAheadSectionToc
          displayData={displayData ?? undefined}
          isLoading={isPreviewLoading}
          isFresh={isFresh && !isWrongReport}
          sectionScrollMarginPx={sectionScrollMarginPx}
        />

        <div
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
        </div>
      </div>
    </div>
  );
}
