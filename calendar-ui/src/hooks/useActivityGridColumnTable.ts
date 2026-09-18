import { arrayMove } from '@dnd-kit/sortable';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type PaginationState,
  type Updater,
} from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ActivityTableRow } from '@/components/activity/ActivityTable/activityTableRow';
import type { ActivityTableCore } from '@/hooks/useActivityTableCore';
import { reconcileColumnOrder } from '@/lib/activityTableLayoutPreferences';

import type { UseActivityGridLayoutPreferencesResult } from './useActivityGridLayoutPreferences';

/** Column that stays pinned to the left and cannot be dragged. */
export const SELECT_COLUMN_ID = 'select';

function applyUpdater<T>(updater: Updater<T>, previous: T): T {
  return typeof updater === 'function'
    ? (updater as (prev: T) => T)(previous)
    : updater;
}

export interface UseActivityGridColumnTableOptions {
  columns: ColumnDef<ActivityTableRow, unknown>[];
  /** Column ids in their default left-to-right order. */
  defaultColumnOrder: string[];
  core: ActivityTableCore;
  layoutPreferences: UseActivityGridLayoutPreferencesResult;
}

/**
 * Wires a grid layout's columns to TanStack Table with drag-to-reorder and
 * drag-to-resize, persisting both in sessionStorage. The select
 * column is excluded from reordering so bulk selection stays in place.
 */
export function useActivityGridColumnTable({
  columns,
  defaultColumnOrder,
  core,
  layoutPreferences,
}: UseActivityGridColumnTableOptions) {
  const {
    sortedData,
    pagination,
    onPaginationChange,
    userMap,
    handleHeaderSort,
  } = core;
  const { getColumnOrder, setColumnOrder, getColumnSizing, setColumnSizing } =
    layoutPreferences;

  const storedOrder = getColumnOrder();
  const storedSizing = getColumnSizing();

  const [columnOrder, setColumnOrderState] = useState<ColumnOrderState>(() =>
    reconcileColumnOrder(storedOrder, defaultColumnOrder)
  );

  const defaultOrderSignature = defaultColumnOrder.join(',');
  useEffect(() => {
    setColumnOrderState((current) =>
      reconcileColumnOrder(current, defaultColumnOrder)
    );
    // defaultColumnOrder is rebuilt each render; compare by signature instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultOrderSignature]);

  const columnSizing = useMemo<ColumnSizingState>(
    () => ({ ...storedSizing }),
    [storedSizing]
  );

  const handleColumnSizingChange = useCallback(
    (updater: Updater<ColumnSizingState>) => {
      const next = applyUpdater(updater, columnSizing);
      const rounded: Record<string, number> = {};
      for (const [id, size] of Object.entries(next)) {
        if (Number.isFinite(size) && size > 0) rounded[id] = Math.round(size);
      }
      setColumnSizing(rounded);
    },
    [columnSizing, setColumnSizing]
  );

  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      onPaginationChange(applyUpdater(updater, pagination));
    },
    [onPaginationChange, pagination]
  );

  const columnPinning = useMemo<ColumnPinningState>(
    () => ({ left: [SELECT_COLUMN_ID] }),
    []
  );

  const table = useReactTable({
    data: sortedData,
    columns,
    state: { columnOrder, columnSizing, pagination, columnPinning },
    onColumnOrderChange: (updater) => {
      setColumnOrderState((prev) => {
        const next = applyUpdater(updater, prev);
        setColumnOrder(next);
        return next;
      });
    },
    onColumnSizingChange: handleColumnSizingChange,
    onPaginationChange: handlePaginationChange,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    getRowId: (row) => String(row.id),
    meta: { userMap, handleHeaderSort },
  });

  /** Column ids that participate in header drag-and-drop (select stays fixed). */
  const draggableColumnIds = useMemo(
    () => columnOrder.filter((id) => id !== SELECT_COLUMN_ID),
    [columnOrder]
  );

  const moveColumn = useCallback(
    (activeId: string, overId: string) => {
      if (activeId === overId) return;
      setColumnOrderState((prev) => {
        const fromIndex = prev.indexOf(activeId);
        const toIndex = prev.indexOf(overId);
        if (fromIndex === -1 || toIndex === -1) return prev;
        const next = arrayMove(prev, fromIndex, toIndex);
        setColumnOrder(next);
        return next;
      });
    },
    [setColumnOrder]
  );

  return { table, columnOrder, draggableColumnIds, moveColumn };
}
