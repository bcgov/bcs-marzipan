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
import { CSS } from '@dnd-kit/utilities';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
} from '@tanstack/react-table';
import { GripVertical } from 'lucide-react';
import { useState } from 'react';

import { SortIndicator } from '@/components/table/SortIndicator';
import {
  tableBodyRow,
  tableTable,
  tableTd,
  tableTh,
  tableThead,
} from '@/components/table/tableConstants';
import { cn } from '@/lib/utils';

/** Padding for the drag-order column; width comes from {@link REORDER_COL_CLASS}. */
const tableReorderCol = 'whitespace-nowrap px-2';

/** Fixed width so the header label fits; not driven by the row grip icon alone. */
const REORDER_COL_CLASS = 'w-16';

interface GenericDataTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  getRowId?: (row: T) => string;
  /** When set, rows show a drag handle; data order is used as-is (column sorting disabled). */
  onReorder?: (activeId: string, overId: string) => void;
  /** Keeps drag handles visible but inert (e.g. while a reorder is saving). */
  reorderDisabled?: boolean;
}

function SortableRow<T extends object>({
  row,
  disabled,
}: {
  row: Row<T>;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, disabled });

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
          aria-label="Drag to reorder"
          disabled={disabled}
          className="inline-flex cursor-grab touch-none text-slate-400 hover:text-slate-600 disabled:cursor-wait disabled:opacity-50"
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

const NO_SORTING: SortingState = [];

export function GenericDataTable<T extends object>({
  data,
  columns,
  getRowId,
  onReorder,
  reorderDisabled = false,
}: GenericDataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const table = useReactTable({
    data,
    columns,
    getRowId:
      getRowId ??
      ((row, idx) => String((row as { id?: string | number }).id ?? idx)),
    state: { sorting: onReorder ? NO_SORTING : sorting },
    onSortingChange: setSorting,
    enableSorting: !onReorder,
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

  const tableElement = (
    <table className={tableTable}>
      {onReorder && (
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
          <col className={REORDER_COL_CLASS} />
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
            {onReorder && (
              <th
                className={cn(tableTh, tableReorderCol, 'text-center')}
                scope="col"
              >
                Order
              </th>
            )}
          </tr>
        ))}
      </thead>
      {onReorder ? (
        <SortableContext
          items={rows.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          <tbody>
            {rows.map((row) => (
              <SortableRow key={row.id} row={row} disabled={reorderDisabled} />
            ))}
          </tbody>
        </SortableContext>
      ) : (
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={tableBodyRow}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={tableTd}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      )}
    </table>
  );

  if (!onReorder) return tableElement;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {tableElement}
    </DndContext>
  );
}
