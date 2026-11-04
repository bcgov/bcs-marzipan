import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS, type Transform } from '@dnd-kit/utilities';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { useState } from 'react';

import { SortIndicator } from '@/components/table/SortIndicator';
import {
  tableBodyRow,
  tableTable,
  tableTd,
  tableTh,
  tableThead,
} from '@/components/table/tableConstants';
import type { LookupReorderInteraction } from '@/lib/lookupReorderUiPreferences';
import { cn } from '@/lib/utils';

/** Order column: fixed width under table-fixed so header text does not force horizontal scroll. */
const tableReorderCol =
  'w-20 min-w-20 max-w-20 whitespace-nowrap px-2 py-3 pr-4 text-center';

const REORDER_COL_WIDTH_CLASS = 'w-20';

/** Matches `@dnd-kit/modifiers` `restrictToVerticalAxis` (row reorder only needs Y). */
function restrictToVerticalAxis({
  transform,
}: {
  transform: Transform;
}): Transform {
  return { ...transform, x: 0 };
}

interface GenericDataTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  getRowId?: (row: T) => string;
  /** When set, rows can be reordered (drag and/or step, see reorderInteraction). */
  onReorder?: (activeId: string, overId: string) => void;
  /** Shows the order column (e.g. lookup admin custom sort). */
  showOrderColumn?: boolean;
  /** Drag handle vs up/down step buttons when reordering. */
  reorderInteraction?: LookupReorderInteraction;
  /** Disables reorder controls while a save is in flight. */
  reorderDisabled?: boolean;
  onMoveUp?: (rowId: string) => void;
  onMoveDown?: (rowId: string) => void;
}

function StepOrderControls({
  rowId,
  rowIndex,
  rowCount,
  disabled,
  onMoveUp,
  onMoveDown,
}: {
  rowId: string;
  rowIndex: number;
  rowCount: number;
  disabled: boolean;
  onMoveUp?: (rowId: string) => void;
  onMoveDown?: (rowId: string) => void;
}) {
  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <button
        type="button"
        aria-label="Move up"
        disabled={disabled || rowIndex === 0 || !onMoveUp}
        className="text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => onMoveUp?.(rowId)}
      >
        <ChevronUp className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Move down"
        disabled={disabled || rowIndex >= rowCount - 1 || !onMoveDown}
        className="text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => onMoveDown?.(rowId)}
      >
        <ChevronDown className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function SortableRow<T extends object>({
  row,
  reorderDisabled,
}: {
  row: Row<T>;
  reorderDisabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, disabled: reorderDisabled });

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative',
        zIndex: isDragging ? 1 : undefined,
      }}
      className={cn(tableBodyRow, isDragging && 'bg-slate-100 opacity-80')}
    >
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className={tableTd}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
      <td className={cn(tableTd, tableReorderCol, 'text-center')}>
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label="Drag to reorder. Space to pick up, arrow keys to move."
          disabled={reorderDisabled}
          className={cn(
            'inline-flex cursor-grab touch-none text-slate-400 hover:text-slate-600 disabled:cursor-wait disabled:opacity-50'
          )}
          {...attributes}
          {...listeners}
        >
          <GripVertical
            size={16}
            strokeWidth={2}
            className="size-4"
            aria-hidden="true"
          />
        </button>
      </td>
    </tr>
  );
}

function StepRowWithOrder<T extends object>({
  row,
  rowIndex,
  rowCount,
  reorderDisabled,
  onMoveUp,
  onMoveDown,
}: {
  row: Row<T>;
  rowIndex: number;
  rowCount: number;
  reorderDisabled: boolean;
  onMoveUp?: (rowId: string) => void;
  onMoveDown?: (rowId: string) => void;
}) {
  return (
    <tr className={tableBodyRow}>
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className={tableTd}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
      <td className={cn(tableTd, tableReorderCol, 'text-center')}>
        <StepOrderControls
          rowId={row.id}
          rowIndex={rowIndex}
          rowCount={rowCount}
          disabled={reorderDisabled}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      </td>
    </tr>
  );
}

const NO_SORTING: SortingState = [];

export function GenericDataTable<T extends object>({
  data,
  columns,
  getRowId,
  onReorder,
  showOrderColumn = false,
  reorderInteraction = 'step',
  reorderDisabled = false,
  onMoveUp,
  onMoveDown,
}: GenericDataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const orderColumnVisible = showOrderColumn || Boolean(onReorder);
  const dragEnabled = Boolean(onReorder) && reorderInteraction === 'drag';

  const table = useReactTable({
    data,
    columns,
    getRowId:
      getRowId ??
      ((row, idx) => String((row as { id?: string | number }).id ?? idx)),
    state: { sorting: dragEnabled ? NO_SORTING : sorting },
    onSortingChange: setSorting,
    enableSorting: !dragEnabled,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      onReorder?.(String(active.id), String(over.id));
    }
  };

  const activeSort = sorting[0];
  const sortKey = activeSort?.id ?? null;
  const sortDirection = activeSort?.desc ? 'desc' : 'asc';

  const rows = table.getRowModel().rows;
  const rowCount = rows.length;

  const orderHeader = (
    <th className={cn(tableTh, tableReorderCol)} scope="col">
      Order
    </th>
  );

  const tableElement = (
    <table className={tableTable}>
      {orderColumnVisible && (
        <colgroup>
          {columns.map((column, index) => (
            <col
              key={
                typeof column.id === 'string'
                  ? column.id
                  : 'accessorKey' in column &&
                      typeof column.accessorKey === 'string'
                    ? column.accessorKey
                    : index
              }
            />
          ))}
          <col className={REORDER_COL_WIDTH_CLASS} />
        </colgroup>
      )}
      <thead className={tableThead}>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const canSort = header.column.getCanSort();
              return (
                <th
                  key={header.id}
                  className={cn(
                    tableTh,
                    canSort && 'cursor-pointer select-none'
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="inline-flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    <SortIndicator
                      columnId={header.column.id}
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      className="size-4 shrink-0"
                    />
                  </span>
                </th>
              );
            })}
            {orderColumnVisible && orderHeader}
          </tr>
        ))}
      </thead>
      {dragEnabled ? (
        <SortableContext
          items={rows.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          <tbody>
            {rows.map((row) => (
              <SortableRow
                key={row.id}
                row={row}
                reorderDisabled={reorderDisabled}
              />
            ))}
          </tbody>
        </SortableContext>
      ) : (
        <tbody>
          {rows.map((row, rowIndex) =>
            orderColumnVisible ? (
              <StepRowWithOrder
                key={row.id}
                row={row}
                rowIndex={rowIndex}
                rowCount={rowCount}
                reorderDisabled={reorderDisabled}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
              />
            ) : (
              <tr key={row.id} className={tableBodyRow}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={tableTd}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            )
          )}
        </tbody>
      )}
    </table>
  );

  if (!dragEnabled) return tableElement;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      {tableElement}
    </DndContext>
  );
}
