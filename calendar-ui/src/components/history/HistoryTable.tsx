import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type Row,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ListChevronsDownUp,
  ListChevronsUpDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import {
  tableBodyRow,
  tableTable,
  tableTd,
  tableTh,
  tableThead,
} from '@/components/table/tableConstants';
import { cn } from '@/lib/utils';

import {
  historyDetailsBadgeLabels,
  historyDetailsHasDisclosure,
  historyDetailsHideLabel,
  historyDetailsShowLabel,
} from './history-details-label';
import { buildHistoryTableRows } from './history-table-rows';
import {
  historyTableEntryRowId,
  isHistoryTableEntryRow,
  type HistoryTableRow,
} from './history-table-types';
import type { HistoryEntryViewModel } from './history-types';
import { HistoryBadgeTrigger } from './HistoryBadgeTrigger';
import { HistoryChangeList } from './HistoryChangeList';
import { HistoryRecencyDateTime } from './HistoryRecencyDateTime';

export const HISTORY_TABLE_COLUMN_COUNT = 7;

export type HistoryTableColumnId =
  | 'user'
  | 'type'
  | 'title'
  | 'activityId'
  | 'details'
  | 'date'
  | 'expand';

type HistoryTableColumnLayoutEntry = {
  width: string;
  minWidth?: string;
  maxWidth?: string;
  className?: string;
};

/** Percentage widths and min/max widths for table-fixed layout (see table README). */
export const HISTORY_TABLE_COLUMN_LAYOUT: Record<
  HistoryTableColumnId,
  HistoryTableColumnLayoutEntry
> = {
  user: { width: '14%', minWidth: '8rem', className: 'min-w-[8rem]' },
  /** Fixed width sized for "Delete requested"; cell classes prevent growth on wide viewports. */
  type: {
    width: '9.5rem',
    className: 'w-[9.5rem] max-w-[9.5rem] overflow-hidden',
  },
  title: { width: '31%' },
  activityId: { width: '10%', minWidth: '6.5rem', className: 'min-w-[6.5rem]' },
  details: { width: '18%' },
  date: { width: '12%', minWidth: '7rem', className: 'min-w-[7rem]' },
  expand: { width: '5%', minWidth: '2.5rem', className: 'min-w-[2.5rem]' },
};

export const HISTORY_TABLE_COLUMN_ORDER: readonly HistoryTableColumnId[] = [
  'user',
  'type',
  'title',
  'activityId',
  'details',
  'date',
  'expand',
];

export function isHistoryTableColumnId(
  columnId: string
): columnId is HistoryTableColumnId {
  return columnId in HISTORY_TABLE_COLUMN_LAYOUT;
}

export function historyTableColumnClassName(
  columnId: string
): string | undefined {
  return isHistoryTableColumnId(columnId)
    ? HISTORY_TABLE_COLUMN_LAYOUT[columnId].className
    : undefined;
}

export function historyTableColStyle(
  columnId: HistoryTableColumnId
): CSSProperties {
  const { width, minWidth, maxWidth } = HISTORY_TABLE_COLUMN_LAYOUT[columnId];
  return {
    width,
    ...(minWidth !== undefined ? { minWidth } : {}),
    ...(maxWidth !== undefined ? { maxWidth } : {}),
  };
}

const expandAllButtonClassName =
  'text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-normal transition-colors outline-none focus-visible:ring-[3px]';

type HistoryTableProps = {
  entries: HistoryEntryViewModel[];
  className?: string;
  children?: (parts: { expandAll: ReactNode; table: ReactNode }) => ReactNode;
};

function entryHasDisclosure(entry: HistoryEntryViewModel): boolean {
  return historyDetailsHasDisclosure(
    entry.changes.length,
    Boolean(entry.notes?.trim())
  );
}

function pruneExpandedState(
  current: ExpandedState,
  validEntryIds: Set<number>
): ExpandedState {
  if (current === true) {
    return current;
  }

  const next: Record<string, boolean> = {};
  let changed = false;

  for (const [rowId, expanded] of Object.entries(current)) {
    if (!expanded) continue;
    const entryId = Number(rowId.replace(/^entry-/, ''));
    if (validEntryIds.has(entryId)) {
      next[rowId] = true;
    } else {
      changed = true;
    }
  }

  if (!changed && Object.keys(next).length === Object.keys(current).length) {
    return current;
  }

  return next;
}

function UserCell({ entry }: { entry: HistoryEntryViewModel }) {
  const team = entry.team?.trim();

  return (
    <div className="min-w-0">
      <span
        className="text-foreground block truncate text-sm font-medium"
        title={entry.actor.name}
      >
        {entry.actor.name}
      </span>
      {team ? (
        <span
          className="text-muted-foreground block truncate text-xs"
          title={team}
        >
          {team}
        </span>
      ) : null}
    </div>
  );
}

function DetailsBadgeCell({
  entry,
  expanded,
  onToggle,
}: {
  entry: HistoryEntryViewModel;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasNote = Boolean(entry.notes?.trim());
  const hasDisclosure = entryHasDisclosure(entry);

  if (!hasDisclosure) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const badgeLabels = historyDetailsBadgeLabels(entry.changes.length, hasNote);
  const triggerLabel = expanded
    ? historyDetailsHideLabel(entry.changes.length, hasNote)
    : historyDetailsShowLabel(entry.changes.length, hasNote);

  return (
    <div className="flex min-w-0 flex-wrap gap-x-1.5 gap-y-0.5" data-no-row-nav>
      {badgeLabels.map((label) => (
        <HistoryBadgeTrigger
          key={label}
          label={label}
          expanded={expanded}
          aria-label={triggerLabel}
          aria-expanded={expanded}
          onClick={onToggle}
        />
      ))}
    </div>
  );
}

function ExpandCell({
  entry,
  expanded,
  onToggle,
}: {
  entry: HistoryEntryViewModel;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasDisclosure = entryHasDisclosure(entry);

  if (!hasDisclosure) {
    return null;
  }

  return (
    <button
      type="button"
      className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-[3px]"
      aria-label={expanded ? 'Collapse row' : 'Expand row'}
      aria-expanded={expanded}
      data-no-row-nav
      onClick={onToggle}
    >
      <ChevronDown
        className={cn('size-4 transition-transform', expanded && 'rotate-180')}
        aria-hidden
      />
    </button>
  );
}

function DateCell({ timestamp }: { timestamp: string }) {
  return (
    <HistoryRecencyDateTime
      timestamp={timestamp}
      invalidFallback={<span className="text-muted-foreground text-sm">—</span>}
    />
  );
}

function ExpandedDetailsPanel({ entry }: { entry: HistoryEntryViewModel }) {
  return (
    <HistoryChangeList
      mode="preview"
      changes={entry.changes}
      note={entry.notes}
      previewLimit={Number.MAX_SAFE_INTEGER}
      className="py-1"
    />
  );
}

const expandedRowBackgroundClassName = 'bg-muted/20';

function HistoryDataRow({
  row,
  expanded,
}: {
  row: Row<HistoryTableRow>;
  expanded: boolean;
}) {
  if (!isHistoryTableEntryRow(row.original)) {
    return null;
  }

  return (
    <tr
      className={cn(
        tableBodyRow,
        expanded &&
          cn(expandedRowBackgroundClassName, 'hover:bg-muted/20 border-b-0')
      )}
    >
      {row.getVisibleCells().map((cell) => (
        <td
          key={cell.id}
          className={cn(tableTd, historyTableColumnClassName(cell.column.id))}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
}

export function HistoryTable({
  entries,
  className,
  children,
}: HistoryTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const tableRows = useMemo(() => buildHistoryTableRows(entries), [entries]);

  const validEntryIds = useMemo(
    () => new Set(entries.map((entry) => entry.id)),
    [entries]
  );

  const disclosureEntryIds = useMemo(
    () => entries.filter(entryHasDisclosure).map((entry) => entry.id),
    [entries]
  );

  useEffect(() => {
    setExpanded((current) => pruneExpandedState(current, validEntryIds));
  }, [validEntryIds]);

  const columns = useMemo<ColumnDef<HistoryTableRow>[]>(
    () => [
      {
        id: 'user',
        header: 'User',
        cell: ({ row }) => {
          if (!isHistoryTableEntryRow(row.original)) return null;
          return <UserCell entry={row.original.entry} />;
        },
      },
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => {
          if (!isHistoryTableEntryRow(row.original)) return null;
          const actionLabel = row.original.entry.actionLabel;
          return (
            <span
              className="text-foreground block min-w-0 truncate text-sm"
              title={actionLabel}
            >
              {actionLabel}
            </span>
          );
        },
      },
      {
        id: 'title',
        header: 'Title',
        cell: ({ row }) => {
          if (!isHistoryTableEntryRow(row.original)) return null;
          const subject = row.original.entry.subject;
          const title = subject?.title?.trim();
          if (!subject || !title) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          if (!subject.href) {
            return (
              <span
                className="text-foreground line-clamp-2 text-sm leading-snug"
                title={title}
              >
                {title}
              </span>
            );
          }

          return (
            <Link
              to={subject.href}
              state={subject.state}
              className="text-primary line-clamp-2 text-sm leading-snug font-medium hover:underline"
              title={title}
              data-no-row-nav
            >
              {title}
            </Link>
          );
        },
      },
      {
        id: 'activityId',
        header: 'Activity ID',
        cell: ({ row }) => {
          if (!isHistoryTableEntryRow(row.original)) return null;
          const subject = row.original.entry.subject;
          if (!subject?.href || !subject.displayId) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }

          return (
            <Link
              to={subject.href}
              state={subject.state}
              className="text-primary block min-w-0 truncate text-sm font-medium hover:underline"
              data-no-row-nav
            >
              {subject.displayId}
            </Link>
          );
        },
      },
      {
        id: 'details',
        header: 'Details',
        cell: ({ row }) => {
          if (!isHistoryTableEntryRow(row.original)) return null;
          const entry = row.original.entry;
          return (
            <DetailsBadgeCell
              entry={entry}
              expanded={row.getIsExpanded()}
              onToggle={row.getToggleExpandedHandler()}
            />
          );
        },
      },
      {
        id: 'date',
        header: 'Date',
        cell: ({ row }) => {
          if (!isHistoryTableEntryRow(row.original)) return null;
          return <DateCell timestamp={row.original.entry.timestamp} />;
        },
      },
      {
        id: 'expand',
        header: () => <span className="sr-only">Expand row</span>,
        cell: ({ row }) => {
          if (!isHistoryTableEntryRow(row.original)) return null;
          const entry = row.original.entry;
          return (
            <ExpandCell
              entry={entry}
              expanded={row.getIsExpanded()}
              onToggle={row.getToggleExpandedHandler()}
            />
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: tableRows,
    columns,
    getRowId: (row) => historyTableEntryRowId(row.entry.id),
    getRowCanExpand: (row) =>
      isHistoryTableEntryRow(row.original) &&
      entryHasDisclosure(row.original.entry),
    state: { expanded },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    paginateExpandedRows: false,
  });

  const allExpanded =
    disclosureEntryIds.length > 0 &&
    disclosureEntryIds.every((id) => {
      if (expanded === true) return true;
      return Boolean(expanded[historyTableEntryRowId(id)]);
    });

  const toggleAllExpanded = () => {
    if (allExpanded) {
      setExpanded({});
      return;
    }

    setExpanded(
      Object.fromEntries(
        disclosureEntryIds.map((id) => [historyTableEntryRowId(id), true])
      )
    );
  };

  const expandAllButton =
    disclosureEntryIds.length > 0 ? (
      <button
        type="button"
        onClick={toggleAllExpanded}
        className={expandAllButtonClassName}
        aria-label={allExpanded ? 'Collapse all' : 'Expand all'}
      >
        {allExpanded ? (
          <ListChevronsDownUp className="size-3.5 shrink-0" aria-hidden />
        ) : (
          <ListChevronsUpDown className="size-3.5 shrink-0" aria-hidden />
        )}
        {allExpanded ? 'Collapse all' : 'Expand all'}
      </button>
    ) : null;

  const tableNode = (
    <table
      className={cn(tableTable, 'min-w-250', className)}
      role="grid"
      aria-colcount={HISTORY_TABLE_COLUMN_COUNT}
    >
      <colgroup>
        {HISTORY_TABLE_COLUMN_ORDER.map((columnId) => (
          <col key={columnId} style={historyTableColStyle(columnId)} />
        ))}
      </colgroup>
      <thead className={tableThead}>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className={cn(
                  tableTh,
                  historyTableColumnClassName(header.column.id)
                )}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => {
          const entry = row.original.entry;

          const isExpanded = row.getIsExpanded();

          return (
            <Fragment key={row.id}>
              <HistoryDataRow row={row} expanded={isExpanded} />
              {isExpanded ? (
                <tr
                  className={cn(
                    expandedRowBackgroundClassName,
                    'border-b border-slate-100'
                  )}
                >
                  <td
                    colSpan={HISTORY_TABLE_COLUMN_COUNT}
                    className="px-8 py-2 pb-3 align-top"
                  >
                    <ExpandedDetailsPanel entry={entry} />
                  </td>
                </tr>
              ) : null}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );

  if (children) {
    return children({ expandAll: expandAllButton, table: tableNode });
  }

  return (
    <div className="min-w-0 space-y-4">
      {expandAllButton ? (
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          {expandAllButton}
        </div>
      ) : null}
      {tableNode}
    </div>
  );
}
