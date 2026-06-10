import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnOrderState,
  type ColumnSizingState,
  type Header,
  type Updater,
} from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ActivityListItem } from '@corpcal/shared/api/types';
import type { CustomReportFieldConfig } from '@corpcal/shared/reports/customReportFieldConfig';
import {
  tableBodyRow,
  tableTable,
  tableTd,
  tableTh,
  tableThead,
} from '@/components/table/tableConstants';
import { resolveCustomReportColumnWidthPx } from '@/lib/custom-report-column-widths';
import { getSelectedCustomReportColumns } from '@/lib/custom-report-columns';
import { formatCustomReportCell } from '@/lib/custom-report-preview-format';
import { cn } from '@/lib/utils';

function applyUpdater<T>(updater: Updater<T>, previous: T): T {
  return typeof updater === 'function'
    ? (updater as (old: T) => T)(previous)
    : updater;
}

function selectedColumnOrderFromConfig(
  config: CustomReportFieldConfig[]
): string[] {
  return getSelectedCustomReportColumns(config).map((f) => f.key);
}

function selectedOrderSignature(config: CustomReportFieldConfig[]): string {
  return getSelectedCustomReportColumns(config)
    .map((f) => f.key)
    .join('|');
}

function applySelectedColumnOrderToConfig(
  config: CustomReportFieldConfig[],
  orderedSelectedKeys: string[]
): CustomReportFieldConfig[] {
  const indexByKey = new Map(orderedSelectedKeys.map((id, i) => [id, i]));
  return config.map((f) => {
    if (f.selected && indexByKey.has(f.key)) {
      return { ...f, order: indexByKey.get(f.key) as number };
    }
    return f;
  });
}

export interface CustomReportPreviewTableProps {
  activities: ActivityListItem[];
  config: CustomReportFieldConfig[];
  /** When set, column resize and reorder update `config` (order / width). */
  onFieldsChange?: (fields: CustomReportFieldConfig[]) => void;
  className?: string;
  highlightedActivityIds?: ReadonlySet<number>;
}

interface SortableReportHeaderProps {
  header: Header<ActivityListItem, unknown>;
  canResize: boolean;
  onResizePointerDown: (e: { stopPropagation: () => void }) => void;
  onResizeTouchStart: (e: { stopPropagation: () => void }) => void;
  isResizing: boolean;
  dragDisabled: boolean;
}

function SortableReportHeader({
  header,
  canResize,
  onResizePointerDown,
  onResizeTouchStart,
  isResizing,
  dragDisabled,
}: SortableReportHeaderProps) {
  const columnId = header.column.id;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: columnId, disabled: dragDisabled });

  const style = {
    width: header.getSize(),
    minWidth: header.getSize(),
    maxWidth: header.getSize(),
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : undefined,
  };

  return (
    <th
      ref={setNodeRef}
      scope="col"
      style={style}
      className={cn(
        tableTh,
        'relative wrap-break-word whitespace-normal',
        isDragging && 'z-20 bg-slate-200/80',
        isOver && !isDragging && 'ring-primary/40 ring-2 ring-inset'
      )}
    >
      <div className="flex min-w-0 items-stretch">
        <button
          type="button"
          className={cn(
            'min-w-0 flex-1 cursor-grab border-0 bg-transparent py-0 pr-2 pl-0 text-left wrap-break-word whitespace-normal text-inherit active:cursor-grabbing',
            dragDisabled && 'cursor-default'
          )}
          {...(dragDisabled ? {} : { ...attributes, ...listeners })}
        >
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </button>
        {canResize ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={`Resize ${header.column.id} column`}
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizePointerDown(e);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              onResizeTouchStart(e);
            }}
            className={cn(
              'relative z-10 w-1.5 shrink-0 touch-none self-stretch select-none',
              'cursor-col-resize',
              isResizing ? 'bg-primary/40' : 'hover:bg-border bg-transparent'
            )}
          />
        ) : null}
      </div>
    </th>
  );
}

/**
 * Custom report preview: TanStack Table with column order, resize, and header DnD
 * driven by {@link CustomReportFieldConfig}. Cell text matches {@link formatCustomReportCell}
 * (same as XLSX export when using {@link getSelectedCustomReportColumns}).
 */
export function CustomReportPreviewTable({
  activities,
  config,
  onFieldsChange,
  className,
  highlightedActivityIds,
}: CustomReportPreviewTableProps) {
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    selectedColumnOrderFromConfig(config)
  );

  const orderSyncSignature = useMemo(
    () => selectedOrderSignature(config),
    [config]
  );

  useEffect(() => {
    setColumnOrder(selectedColumnOrderFromConfig(config));
  }, [orderSyncSignature, config]);

  const fieldByKey = useMemo(
    () => new Map(config.map((f) => [f.key, f])),
    [config]
  );

  const columns = useMemo<ColumnDef<ActivityListItem, unknown>[]>(() => {
    const keys = columnOrder.filter((id) => fieldByKey.get(id)?.selected);
    const missing = config
      .filter((f) => f.selected && !keys.includes(f.key))
      .sort((a, b) => a.order - b.order)
      .map((f) => f.key);
    const orderedKeys = [...keys, ...missing];

    return orderedKeys.map((key) => {
      const field = fieldByKey.get(key);
      if (!field) {
        throw new Error(`Missing custom report field config for key "${key}"`);
      }
      return {
        id: field.key,
        accessorFn: (row: ActivityListItem) =>
          row[field.key as keyof ActivityListItem],
        header: field.label,
        enableResizing: true,
        size: resolveCustomReportColumnWidthPx(field),
        minSize: 80,
        maxSize: 900,
        cell: ({ row }) => formatCustomReportCell(row.original, field.key),
      };
    });
  }, [columnOrder, config, fieldByKey]);

  const columnSizing = useMemo<ColumnSizingState>(() => {
    const s: ColumnSizingState = {};
    for (const f of config) {
      if (
        f.selected &&
        typeof f.width === 'number' &&
        Number.isFinite(f.width) &&
        f.width > 0
      ) {
        s[f.key] = f.width;
      }
    }
    return s;
  }, [config]);

  const handleColumnOrderChange = useCallback(
    (updater: Updater<ColumnOrderState>) => {
      setColumnOrder((prev) => applyUpdater(updater, prev));
    },
    []
  );

  const handleColumnSizingChange = useCallback(
    (updater: Updater<ColumnSizingState>) => {
      if (!onFieldsChange) return;
      const nextSizing = applyUpdater(updater, columnSizing);
      onFieldsChange(
        config.map((f) => {
          const w = nextSizing[f.key];
          if (w === undefined) return f;
          return { ...f, width: Math.round(w) };
        })
      );
    },
    [config, onFieldsChange, columnSizing]
  );

  const table = useReactTable({
    data: activities,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    state: {
      columnOrder,
      columnSizing,
    },
    onColumnOrderChange: handleColumnOrderChange,
    onColumnSizingChange: handleColumnSizingChange,
    enableColumnResizing: Boolean(onFieldsChange),
    columnResizeMode: 'onChange',
    defaultColumn: {
      minSize: 80,
      maxSize: 900,
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!onFieldsChange) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setColumnOrder((prev) => {
        const oldIndex = prev.indexOf(String(active.id));
        const newIndex = prev.indexOf(String(over.id));
        if (oldIndex < 0 || newIndex < 0) return prev;
        const next = arrayMove(prev, oldIndex, newIndex);
        onFieldsChange(applySelectedColumnOrderToConfig(config, next));
        return next;
      });
    },
    [config, onFieldsChange]
  );

  if (!config.some((f) => f.selected)) {
    return (
      <div
        className={cn(
          'text-muted-foreground rounded-md border border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm',
          className
        )}
      >
        Select at least one field in Edit Report to see a preview.
      </div>
    );
  }

  const visibleLeafCount = table.getVisibleLeafColumns().length;
  const headerGroup = table.getHeaderGroups()[0];
  const dragDisabled = !onFieldsChange;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <table
        className={cn(
          tableTable,
          'min-w-[640px] border-separate border-spacing-0',
          className
        )}
        style={{
          width: table.getTotalSize(),
          minWidth: '100%',
          tableLayout: 'fixed',
        }}
      >
        <thead className={tableThead}>
          {headerGroup ? (
            <tr>
              <SortableContext
                items={columnOrder}
                strategy={horizontalListSortingStrategy}
              >
                {columnOrder.map((columnId) => {
                  const header = headerGroup.headers.find(
                    (h) => h.column.id === columnId
                  );
                  if (!header) return null;
                  return (
                    <SortableReportHeader
                      key={header.id}
                      header={header}
                      canResize={Boolean(
                        header.column.getCanResize() && onFieldsChange
                      )}
                      onResizePointerDown={(e) => {
                        header.getResizeHandler()(e);
                      }}
                      onResizeTouchStart={(e) => {
                        header.getResizeHandler()(e);
                      }}
                      isResizing={header.column.getIsResizing()}
                      dragDisabled={dragDisabled}
                    />
                  );
                })}
              </SortableContext>
            </tr>
          ) : null}
        </thead>
        <tbody>
          {activities.length === 0 ? (
            <tr>
              <td
                colSpan={visibleLeafCount || 1}
                className={cn(
                  tableTd,
                  'text-muted-foreground py-8 text-center text-sm whitespace-normal'
                )}
              >
                No activities to display.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  tableBodyRow,
                  'odd:bg-white even:bg-slate-50/60',
                  highlightedActivityIds?.has(row.original.id) &&
                    'live-row-highlight'
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      tableTd,
                      'text-foreground text-sm wrap-break-word whitespace-normal'
                    )}
                    style={{
                      width: cell.column.getSize(),
                      minWidth: cell.column.getSize(),
                      maxWidth: cell.column.getSize(),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </DndContext>
  );
}
