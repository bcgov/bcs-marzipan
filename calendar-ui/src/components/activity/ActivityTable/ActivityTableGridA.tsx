import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';

import { SortableColumnHeader } from '@/components/table/SortableColumnHeader';
import { useActivityGridColumnTable } from '@/hooks/useActivityGridColumnTable';
import type { UseActivityGridLayoutPreferencesResult } from '@/hooks/useActivityGridLayoutPreferences';
import {
  useActivityTableCore,
  type ActivityTableCoreOptions,
} from '@/hooks/useActivityTableCore';

import { ActivityBulkSelectHeader } from './ActivityBulkSelectHeader';
import {
  GRID_A_COLUMN_ORDER,
  GRID_A_COLUMN_WIDTHS,
  gridColumnSize,
} from './activityGridDefaults';
import { ActivityGridTable } from './ActivityGridTable';
import { ActivityTableFrame } from './ActivityTableFrame';
import type { ActivityTableRow } from './activityTableRow';
import { ACTIVITY_SORT_COLUMNS } from './activityTableSortColumns';
import {
  ActivityStatusCell,
  ActivityTimestampsCell,
  CategoryBadgesCell,
  MaterialsCellCompact,
  OverviewIconsCell,
  OverviewPitchLine,
  SchedulingCellCompact,
  SelectCheckboxCell,
  TitleSummaryCell,
} from './cells';
import { GridStatusColumnHeader } from './GridStatusColumnHeader';
import { GRID_A_SELECT_CHECKBOX_HEADER_ALIGN_CLASS } from './selectColumnLayout';

export interface ActivityTableGridAProps extends ActivityTableCoreOptions {
  layoutPreferences: UseActivityGridLayoutPreferencesResult;
}

/** Grid A: compact rows with overview icons, summary, scheduling, comms, and status metadata. */
export function ActivityTableGridA({
  layoutPreferences,
  ...coreOptions
}: ActivityTableGridAProps) {
  const core = useActivityTableCore(coreOptions);
  const {
    canBulkSelect,
    canFlag,
    showReviewHighlights,
    effectiveSortKey,
    effectiveSortDirection,
    handleSortChange,
    selectedActivityIds,
    toggleActivitySelected,
    watchlistActivityIdSet,
    syncFlagsMutation,
    toggleFavourite,
    isFavouriteToggling,
    userMap,
    pitchFieldVisibility,
  } = core;

  const storedSizing = layoutPreferences.getColumnSizing();
  const columnHelper = createColumnHelper<ActivityTableRow>();
  const defaultColumnOrder = useMemo(() => [...GRID_A_COLUMN_ORDER], []);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        enableResizing: false,
        header: () =>
          canBulkSelect ? (
            <div className={GRID_A_SELECT_CHECKBOX_HEADER_ALIGN_CLASS}>
              <ActivityBulkSelectHeader core={core} />
            </div>
          ) : null,
        ...gridColumnSize('select', GRID_A_COLUMN_WIDTHS, storedSizing),
        cell: ({ row }) =>
          canBulkSelect ? (
            <SelectCheckboxCell
              activityLabel={row.original.displayId ?? String(row.original.id)}
              checked={selectedActivityIds.has(row.original.id)}
              onCheckedChange={(selected) =>
                toggleActivitySelected(row.original.id, selected)
              }
            />
          ) : null,
      }),
      columnHelper.display({
        id: 'overview',
        header: () => (
          <SortableColumnHeader
            title="Overview"
            sortColumnId="activityId"
            sortColumns={ACTIVITY_SORT_COLUMNS}
            effectiveSortKey={effectiveSortKey}
            effectiveSortDirection={effectiveSortDirection}
          />
        ),
        meta: { sortKey: 'activityId' as const },
        ...gridColumnSize('overview', GRID_A_COLUMN_WIDTHS, storedSizing),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <OverviewIconsCell
              row={row.original}
              canFlag={canFlag}
              isFavourite={watchlistActivityIdSet.has(row.original.id)}
              onFavouriteToggle={() => toggleFavourite(row.original.id)}
              favouriteToggling={isFavouriteToggling}
              onFlagSync={(
                teamId,
                assigneeIds,
                assigneeNames,
                displayTeamPerAssignee
              ) =>
                syncFlagsMutation.mutate({
                  activityId: row.original.id,
                  body: { teamId, assigneeIds, displayTeamPerAssignee },
                  assigneeNames,
                })
              }
              flagPending={syncFlagsMutation.isPending}
            />
            <CategoryBadgesCell
              row={row.original}
              showReviewHighlights={showReviewHighlights}
            />
          </div>
        ),
      }),
      columnHelper.display({
        id: 'summary',
        header: () => (
          <SortableColumnHeader
            title="Summary"
            sortColumnId="lookAheadStatus"
            sortColumns={ACTIVITY_SORT_COLUMNS}
            effectiveSortKey={effectiveSortKey}
            effectiveSortDirection={effectiveSortDirection}
          />
        ),
        meta: { sortKey: 'lookAheadStatus' as const },
        ...gridColumnSize('summary', GRID_A_COLUMN_WIDTHS, storedSizing),
        cell: ({ row }) => (
          <TitleSummaryCell
            row={row.original}
            showReviewHighlights={showReviewHighlights}
          />
        ),
      }),
      columnHelper.display({
        id: 'scheduling',
        header: () => (
          <SortableColumnHeader
            title="Scheduling"
            sortColumnId="startDate"
            sortColumns={ACTIVITY_SORT_COLUMNS}
            effectiveSortKey={effectiveSortKey}
            effectiveSortDirection={effectiveSortDirection}
          />
        ),
        meta: { sortKey: 'startDate' as const },
        ...gridColumnSize('scheduling', GRID_A_COLUMN_WIDTHS, storedSizing),
        cell: ({ row }) => (
          <SchedulingCellCompact
            row={row.original}
            showReviewHighlights={showReviewHighlights}
          />
        ),
      }),
      columnHelper.display({
        id: 'materials',
        header: 'Comms',
        ...gridColumnSize('materials', GRID_A_COLUMN_WIDTHS, storedSizing),
        cell: ({ row }) => <MaterialsCellCompact row={row.original} />,
      }),
      columnHelper.display({
        id: 'status',
        header: () => (
          <GridStatusColumnHeader
            effectiveSortKey={effectiveSortKey}
            effectiveSortDirection={effectiveSortDirection}
            onSortChange={handleSortChange}
          />
        ),
        meta: {
          sortKeys: ['activityStatus', 'lastUpdated', 'createdDateTime'],
        },
        ...gridColumnSize('status', GRID_A_COLUMN_WIDTHS, storedSizing),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <ActivityStatusCell row={row.original} orientation="inline" />
            <OverviewPitchLine
              row={row.original}
              canViewPitchStatus={pitchFieldVisibility.canViewPitchStatus}
              showReviewHighlights={showReviewHighlights}
            />
            <ActivityTimestampsCell
              row={row.original}
              userMap={userMap}
              showUpdatedByAvatar={false}
            />
          </div>
        ),
      }),
    ],
    [
      columnHelper,
      core,
      canBulkSelect,
      storedSizing,
      effectiveSortKey,
      effectiveSortDirection,
      handleSortChange,
      showReviewHighlights,
      canFlag,
      watchlistActivityIdSet,
      syncFlagsMutation,
      selectedActivityIds,
      toggleActivitySelected,
      toggleFavourite,
      isFavouriteToggling,
      userMap,
      pitchFieldVisibility.canViewPitchStatus,
    ]
  );

  const { table, columnOrder, draggableColumnIds, moveColumn } =
    useActivityGridColumnTable({
      columns,
      defaultColumnOrder,
      core,
      layoutPreferences,
    });

  return (
    <ActivityTableFrame core={core}>
      <ActivityGridTable
        table={table}
        columnOrder={columnOrder}
        draggableColumnIds={draggableColumnIds}
        onColumnDragEnd={moveColumn}
        core={core}
      />
    </ActivityTableFrame>
  );
}
