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

interface GenericDataTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  getRowId?: (row: T) => string;
  /** When set, rows show a drag handle; data order is used as-is (column sorting disabled). */
  onReorder?: (activeId: string, overId: string) => void;
}

function SortableRow<T extends object>({ row }: { row: Row<T> }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

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
      <td className={tableTd}>
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label="Drag to reorder"
          className="cursor-grab touch-none text-slate-400 hover:text-slate-600"
          {...attributes}
          {...listeners}
        >
          <span aria-hidden="true" className="flex h-5 items-stretch gap-1">
            <span className="w-0.5 rounded bg-current" />
            <span className="w-0.5 rounded bg-current" />
            <span className="w-0.5 rounded bg-current" />
          </span>
        </button>
      </td>
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className={tableTd}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
}

const NO_SORTING: SortingState = [];

export function GenericDataTable<T extends object>({
  data,
  columns,
  getRowId,
  onReorder,
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
      <thead className={tableThead}>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {onReorder && <th className={tableTh}>Order</th>}
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
              <SortableRow key={row.id} row={row} />
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
