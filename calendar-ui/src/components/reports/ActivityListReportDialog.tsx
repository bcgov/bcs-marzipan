import { Download, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import { ActivityListReportDateRangeControl } from '@/components/reports/ActivityListReportDateRangeControl';
import { ActivityReportPreviewShell } from '@/components/reports/ActivityReportPreviewShell';
import { TableContentSummary } from '@/components/table/TableSummaryBar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useActivityReportPreview } from '@/hooks/useActivityReportPreview';
import { useActivityTableFilterLookups } from '@/hooks/useActivityTableFilterLookups';
import { useAuth } from '@/hooks/useAuth';
import { useActivityStatuses } from '@/hooks/useLookups';
import {
  buildActivityListEffectiveScope,
  type ActivityListScopeContextLine,
  type ActivityListScopeInput,
} from '@/lib/activity-list-effective-scope';
import {
  snapshotPreferencesForReportDialog,
  type ActivityListReportName,
} from '@/lib/activity-list-report-params';
import { buildActivityTableFilterSummaryDetails } from '@/lib/activity-table-summary-bar-state';
import type { ActivityTablePreferences } from '@/lib/activityTablePreferencesParams';
import {
  DIALOG_TITLE_CHROME_RESET_CLASS,
  PAGE_PRIMARY_TITLE_CLASS,
  PAGE_TITLE_ADDON_ROW_CLASS,
} from '@/lib/pageTitleChrome';
import { cn } from '@/lib/utils';

export interface ActivityListReportDialogProps {
  reportName: ActivityListReportName;
  displayTitle: string;
  listPreferences: ActivityTablePreferences;
  appliedSavedFilterName?: string | null;
  scopeInput: ActivityListScopeInput;
  tabContextLines?: ActivityListScopeContextLine[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivityListReportDialog({
  reportName,
  displayTitle,
  listPreferences,
  appliedSavedFilterName,
  scopeInput,
  open,
  onOpenChange,
}: ActivityListReportDialogProps) {
  const { hasPermission } = useAuth();
  const canViewDeleted = hasPermission(PERMISSIONS.ACTIVITIES.VIEW_DELETED);

  const [ephemeralPreferences, setEphemeralPreferences] =
    useState<ActivityTablePreferences>(() =>
      snapshotPreferencesForReportDialog(listPreferences, reportName)
    );

  const listPreferencesRef = useRef(listPreferences);
  listPreferencesRef.current = listPreferences;

  useEffect(() => {
    if (!open) return;
    setEphemeralPreferences(
      snapshotPreferencesForReportDialog(listPreferencesRef.current, reportName)
    );
  }, [open, reportName]);

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

  const effectiveScope = useMemo(
    () =>
      buildActivityListEffectiveScope({
        ...scopeInput,
        statusArchiveIds: scopeInput.statusArchiveIds ?? statusArchiveIds,
        preferences: {
          filterState: ephemeralPreferences.filterState,
        },
      }),
    [scopeInput, statusArchiveIds, ephemeralPreferences]
  );

  const preview = useActivityReportPreview({
    reportName,
    preferences: ephemeralPreferences,
    setPreferencesState: setEphemeralPreferences,
    canViewDeleted,
    statusArchiveIds,
    reportFetchParams: effectiveScope.reportFetchParams,
    reportFetchParamsKey: effectiveScope.reportFetchParamsKey,
    reportFetchEnabled: effectiveScope.reportAvailability === 'allowed',
  });

  const { filterSummaryContext, statusArchiveIds: summaryArchiveIds } =
    useActivityTableFilterLookups(canViewDeleted);

  const filterSummary = useMemo(
    () =>
      buildActivityTableFilterSummaryDetails({
        filterState: ephemeralPreferences.filterState,
        searchKeyword: ephemeralPreferences.searchKeyword,
        filterSummaryContext,
        statusArchiveIds: summaryArchiveIds,
      }),
    [
      ephemeralPreferences.filterState,
      ephemeralPreferences.searchKeyword,
      filterSummaryContext,
      summaryArchiveIds,
    ]
  );

  const filterDetailLines = useMemo(
    () => [
      ...effectiveScope.tabContextLines,
      ...filterSummary.filterDetailLines,
    ],
    [effectiveScope.tabContextLines, filterSummary.filterDetailLines]
  );

  const filterCount = preview.activeFilterCount;
  const filterCountLabel =
    filterCount === 1 ? '1 filter applied' : `${filterCount} filters applied`;

  const showDayRangeTabs =
    reportName === 'thirty-sixty-ninety' ||
    reportName === 'planning' ||
    reportName === 'custom';

  const hasFilterSummaryContent =
    filterDetailLines.length > 0 || appliedSavedFilterName != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100dvh-6rem)] max-h-[calc(100dvh-6rem)] w-[calc(100vw-6rem)] max-w-[calc(100vw-6rem)] flex-col gap-0 overflow-hidden p-0 sm:rounded-lg">
        <div className="border-border flex shrink-0 flex-col gap-2 border-b px-4 pt-4 pr-14 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={PAGE_TITLE_ADDON_ROW_CLASS}>
              <DialogTitle
                className={cn(
                  PAGE_PRIMARY_TITLE_CLASS,
                  DIALOG_TITLE_CHROME_RESET_CLASS
                )}
              >
                {displayTitle}
              </DialogTitle>
              {showDayRangeTabs ? (
                <ActivityListReportDateRangeControl
                  dateRange={ephemeralPreferences.filterState.dateRange}
                  onDateRangeChange={(dateRange) =>
                    preview.setPreferences({
                      filterState: {
                        ...ephemeralPreferences.filterState,
                        dateRange,
                      },
                    })
                  }
                />
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {reportName === 'custom' ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => preview.setIsEditModalOpen(true)}
                >
                  Customize
                </Button>
              ) : null}
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={
                  !preview.displayData ||
                  !preview.isFresh ||
                  preview.isExporting
                }
                className="gap-2"
                onClick={() =>
                  void preview.runExport(preview.exportConfig.format)
                }
              >
                <Download className="h-4 w-4" />
                {preview.isExporting
                  ? 'Exporting...'
                  : preview.exportConfig.label}
              </Button>
            </div>
          </div>

          <DialogDescription className="sr-only">
            Report preview filtered from the activity list
          </DialogDescription>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <TableContentSummary
              count={preview.displayActivityCount}
              singularLabel="activity"
              pluralLabel="activities"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground gap-1.5"
                  disabled={!hasFilterSummaryContent}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {!hasFilterSummaryContent
                    ? 'No filters applied'
                    : filterCountLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 max-w-[90vw] p-3">
                {appliedSavedFilterName ? (
                  <p className="mb-2 text-sm font-medium">
                    Saved filter: {appliedSavedFilterName}
                  </p>
                ) : null}
                {filterDetailLines.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No filters from the activity list apply to this report.
                  </p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {filterDetailLines.map((line, index) => (
                      <li key={`${line.label}-${index}`}>
                        <span className="text-muted-foreground">
                          {line.label}:{' '}
                        </span>
                        {line.value}
                      </li>
                    ))}
                  </ul>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <ActivityReportPreviewShell reportName={reportName} preview={preview} />
      </DialogContent>
    </Dialog>
  );
}
