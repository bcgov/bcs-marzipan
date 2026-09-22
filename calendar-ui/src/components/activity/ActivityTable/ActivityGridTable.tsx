import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, type Header, type Table } from '@tanstack/react-table';
import type { CSSProperties, MouseEvent } from 'react';

import {
  GRID_A_OVERVIEW_COLUMN_ID,
  GRID_A_PINNED_COLUMN_IDS,
} from '@/components/activity/ActivityTable/activityGridPinnedColumns';
import type { ActivityTableRow } from '@/components/activity/ActivityTable/activityTableRow';
import {
  tableBodyRow,
  tableTable,
  tableTd,
  tableTh,
  tableThead,
} from '@/components/table/tableConstants';
import {
  handleTableRowClick,
  handleTableRowKeyDown,
} from '@/components/table/tableRowNavigation';
import { SELECT_COLUMN_ID } from '@/hooks/useActivityGridColumnTable';
import type { ActivityTableCore } from '@/hooks/useActivityTableCore';
import { cn } from '@/lib/utils';

import { isGridHeaderSortBlocked } from './GridStatusColumnHeader';
import { GRID_A_SELECT_COLUMN_CELL_CLASS } from './selectColumnLayout';

function getGridPinnedLeftOffset(
  columnId: string,
  selectColumnWidth: number
): number | undefined {
  if (columnId === SELECT_COLUMN_ID) return 0;
  if (columnId === GRID_A_OVERVIEW_COLUMN_ID) return selectColumnWidth;
  return undefined;
}

function isGridPinnedColumn(columnId: string): boolean {
  return (GRID_A_PINNED_COLUMN_IDS as readonly string[]).includes(columnId);
}

function getGridPinnedStickyStyle(
  columnId: string,
  selectColumnWidth: number,
  layer: 'header' | 'body'
): CSSProperties {
  const left = getGridPinnedLeftOffset(columnId, selectColumnWidth);
  if (left === undefined) return {};
  return {
    position: 'sticky',
    left,
    zIndex: layer === 'header' ? 11 : 2,
  };
}

interface SortableGridHeaderProps {
  header: Header<ActivityTableRow, unknown>;
  dragDisabled: boolean;
  selectColumnWidth: number;
  onHeaderClick?: (event: MouseEvent<HTMLTableCellElement>) => void;
}

function SortableGridHeader({
  header,
  dragDisabled,
  selectColumnWidth,
  onHeaderClick,
}: SortableGridHeaderProps) {
  const columnId = header.column.id;
  const isSelect = columnId === SELECT_COLUMN_ID;
  const isPinned = isGridPinnedColumn(columnId);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: columnId, disabled: dragDisabled || isPinned });

  const meta = header.column.columnDef.meta;
  const hasMultiSort = (meta?.sortKeys?.length ?? 0) > 0;

  const style: CSSProperties = {
    width: header.getSize(),
    minWidth: header.column.columnDef.minSize ?? header.getSize(),
    maxWidth: header.column.columnDef.maxSize ?? header.getSize(),
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : undefined,
    ...getGridPinnedStickyStyle(columnId, selectColumnWidth, 'header'),
  };

  return (
    <th
      ref={setNodeRef}
      className={cn(
        tableTh,
        'relative wrap-break-word whitespace-normal',
        isSelect && GRID_A_SELECT_COLUMN_CELL_CLASS,
        isPinned && 'bg-accent',
        hasMultiSort && 'group',
        isDragging && 'z-20 bg-slate-200/80',
        isOver && !isDragging && 'ring-primary/40 ring-2 ring-inset'
      )}
      style={style}
      onClick={onHeaderClick}
    >
      {isSelect ? (
        header.isPlaceholder ? null : (
          flexRender(header.column.columnDef.header, header.getContext())
        )
      ) : (
        <div className="flex min-w-0 items-stretch">
          <button
            type="button"
            className={cn(
              'min-w-0 flex-1 cursor-grab border-0 bg-transparent py-0 pr-2 pl-0 text-left wrap-break-word whitespace-normal text-inherit active:cursor-grabbing',
              (dragDisabled || isPinned) && 'cursor-default'
            )}
            {...(dragDisabled || isPinned
              ? {}
              : { ...attributes, ...listeners })}
          >
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
          </button>
          {header.column.getCanResize() ? (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label={`Resize ${header.column.id} column`}
              onPointerDown={(e) => {
                e.stopPropagation();
                header.getResizeHandler()(e);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                header.getResizeHandler()(e);
              }}
              className={cn(
                'relative z-10 w-1.5 shrink-0 touch-none self-stretch select-none',
                'cursor-col-resize',
                header.column.getIsResizing()
                  ? 'bg-primary/40'
                  : 'hover:bg-border bg-transparent'
              )}
            />
          ) : null}
        </div>
      )}
    </th>
  );
}

export interface ActivityGridTableProps {
  table: Table<ActivityTableRow>;
  columnOrder: string[];
  draggableColumnIds: string[];
  onColumnDragEnd: (activeId: string, overId: string) => void;
  core: ActivityTableCore;
}

/**
 * Drag-and-drop, resizable activity list table.
 * Select and overview columns stay pinned on the left and are not draggable.
 */
export function ActivityGridTable({
  table,
  columnOrder,
  draggableColumnIds,
  onColumnDragEnd,
  core,
}: ActivityGridTableProps) {
  const { newRowIds, remoteHighlightIds, openActivityWithScroll } = core;

  const selectColumnWidth =
    table.getColumn(SELECT_COLUMN_ID)?.getSize() ??
    table
      .getHeaderGroups()[0]
      ?.headers.find((h) => h.column.id === SELECT_COLUMN_ID)
      ?.getSize() ??
    44;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onColumnDragEnd(String(active.id), String(over.id));
  };

  const headerGroup = table.getHeaderGroups()[0];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <table
        className={cn(
          tableTable,
          'min-w-[640px] border-separate border-spacing-0'
        )}
        role="grid"
        aria-colcount={columnOrder.length}
        style={{
          tableLayout: 'fixed',
          width: table.getTotalSize(),
          minWidth: '100%',
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

                  const meta = header.column.columnDef.meta;
                  const isSortable =
                    meta?.sortKey != null || (meta?.sortKeys?.length ?? 0) > 0;
                  const sortPayload = meta?.sortKeys ?? meta?.sortKey;

                  return (
                    <SortableGridHeader
                      key={header.id}
                      header={header}
                      selectColumnWidth={selectColumnWidth}
                      dragDisabled={!draggableColumnIds.includes(columnId)}
                      onHeaderClick={
                        isSortable
                          ? (e) => {
                              if (isGridHeaderSortBlocked(e.target)) return;
                              const onHeaderSort =
                                table.options.meta?.handleHeaderSort;
                              if (sortPayload != null && onHeaderSort) {
                                onHeaderSort(sortPayload);
                              }
                            }
                          : undefined
                      }
                    />
                  );
                })}
              </SortableContext>
            </tr>
          ) : null}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const isNewRow = newRowIds.has(row.original.id);
            const isHighlightRow = remoteHighlightIds.has(row.original.id);

            return (
              <tr
                key={row.id}
                data-activity-id={row.original.id}
                role="button"
                aria-label={`Open activity ${row.original.title}`}
                className={cn(
                  `group/row ${tableBodyRow} focus-visible:bg-accent/30 cursor-pointer focus-visible:outline-none`,
                  isNewRow && 'animate-in fade-in-0 duration-300',
                  isHighlightRow && 'live-row-highlight'
                )}
                tabIndex={0}
                onClick={(e) => {
                  handleTableRowClick(e, () => {
                    openActivityWithScroll(row.original.id);
                  });
                }}
                onKeyDown={(e) => {
                  handleTableRowKeyDown(e, () => {
                    openActivityWithScroll(row.original.id);
                  });
                }}
              >
                {columnOrder.map((columnId) => {
                  const cell = row
                    .getVisibleCells()
                    .find((c) => c.column.id === columnId);
                  if (!cell) return null;
                  const isSelect = columnId === SELECT_COLUMN_ID;
                  const isPinned = isGridPinnedColumn(columnId);

                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        tableTd,
                        'border-b border-slate-100',
                        isSelect && GRID_A_SELECT_COLUMN_CELL_CLASS,
                        isPinned &&
                          'bg-white group-hover/row:bg-slate-50 group-focus-visible/row:bg-slate-50'
                      )}
                      style={{
                        width: cell.column.getSize(),
                        minWidth:
                          cell.column.columnDef.minSize ??
                          cell.column.getSize(),
                        maxWidth:
                          cell.column.columnDef.maxSize ??
                          cell.column.getSize(),
                        ...getGridPinnedStickyStyle(
                          columnId,
                          selectColumnWidth,
                          'body'
                        ),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </DndContext>
  );
}
