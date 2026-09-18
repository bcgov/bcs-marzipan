import { useEffect, useState } from 'react';

import {
  tableBodyRow,
  tableTable,
  tableTd,
  tableTh,
  tableThead,
} from '@/components/table/tableConstants';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { HISTORY_LIST_CONTENT_CLASSNAME } from './history-list-layout';
import {
  HISTORY_TABLE_COLUMN_LAYOUT,
  HISTORY_TABLE_COLUMN_ORDER,
  historyTableColStyle,
} from './HistoryTable';

const SKELETON_DELAY_MS = 300;
const SKELETON_ENTRY_COUNT = 4;

function HistoryEntrySkeleton() {
  return (
    <div className="border-border rounded-md border px-2 py-1.5">
      <div className="min-w-0 space-y-2">
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-5 w-28 rounded-full" />
      </div>
    </div>
  );
}

type HistoryListSkeletonProps = {
  className?: string;
  entryCount?: number;
};

export function HistoryListSkeleton({
  className,
  entryCount = SKELETON_ENTRY_COUNT,
}: HistoryListSkeletonProps) {
  return (
    <div
      className={cn('space-y-2', HISTORY_LIST_CONTENT_CLASSNAME, className)}
      aria-hidden="true"
    >
      {Array.from({ length: entryCount }, (_, index) => (
        <HistoryEntrySkeleton key={index} />
      ))}
    </div>
  );
}

type HistoryListLoadingProps = {
  className?: string;
  entryCount?: number;
};

export function HistoryListLoading({
  className,
  entryCount,
}: HistoryListLoadingProps) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(
      () => setShowSkeleton(true),
      SKELETON_DELAY_MS
    );
    return () => window.clearTimeout(id);
  }, []);

  if (!showSkeleton) {
    return null;
  }

  return <HistoryListSkeleton className={className} entryCount={entryCount} />;
}

const TABLE_SKELETON_ROW_COUNT = 6;

function HistoryTableSkeletonRow() {
  return (
    <tr className={tableBodyRow} aria-hidden>
      <td className={cn(tableTd, HISTORY_TABLE_COLUMN_LAYOUT.user.className)}>
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </td>
      <td className={cn(tableTd, HISTORY_TABLE_COLUMN_LAYOUT.type.className)}>
        <Skeleton className="h-4 w-full max-w-[7rem]" />
      </td>
      <td className={tableTd}>
        <Skeleton className="h-4 w-full max-w-xs" />
      </td>
      <td
        className={cn(
          tableTd,
          HISTORY_TABLE_COLUMN_LAYOUT.activityId.className
        )}
      >
        <Skeleton className="h-4 w-24" />
      </td>
      <td className={tableTd}>
        <Skeleton className="h-5 w-20 rounded-full" />
      </td>
      <td className={cn(tableTd, HISTORY_TABLE_COLUMN_LAYOUT.date.className)}>
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </td>
      <td className={cn(tableTd, HISTORY_TABLE_COLUMN_LAYOUT.expand.className)}>
        <Skeleton className="mx-auto size-4" />
      </td>
    </tr>
  );
}

type HistoryTableSkeletonProps = {
  className?: string;
  rowCount?: number;
};

export function HistoryTableSkeleton({
  className,
  rowCount = TABLE_SKELETON_ROW_COUNT,
}: HistoryTableSkeletonProps) {
  return (
    <table
      className={cn(tableTable, 'min-w-[1000px]', className)}
      aria-hidden="true"
    >
      <colgroup>
        {HISTORY_TABLE_COLUMN_ORDER.map((columnId) => (
          <col key={columnId} style={historyTableColStyle(columnId)} />
        ))}
      </colgroup>
      <thead className={tableThead}>
        <tr>
          <th
            className={cn(tableTh, HISTORY_TABLE_COLUMN_LAYOUT.user.className)}
          >
            User
          </th>
          <th
            className={cn(tableTh, HISTORY_TABLE_COLUMN_LAYOUT.type.className)}
          >
            Type
          </th>
          <th className={tableTh}>Title</th>
          <th
            className={cn(
              tableTh,
              HISTORY_TABLE_COLUMN_LAYOUT.activityId.className
            )}
          >
            Activity ID
          </th>
          <th className={tableTh}>Details</th>
          <th
            className={cn(tableTh, HISTORY_TABLE_COLUMN_LAYOUT.date.className)}
          >
            Date
          </th>
          <th
            className={cn(
              tableTh,
              HISTORY_TABLE_COLUMN_LAYOUT.expand.className
            )}
          >
            <span className="sr-only">Expand row</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rowCount }, (_, index) => (
          <HistoryTableSkeletonRow key={index} />
        ))}
      </tbody>
    </table>
  );
}

type HistoryTableLoadingProps = {
  className?: string;
  rowCount?: number;
};

export function HistoryTableLoading({
  className,
  rowCount,
}: HistoryTableLoadingProps) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(
      () => setShowSkeleton(true),
      SKELETON_DELAY_MS
    );
    return () => window.clearTimeout(id);
  }, []);

  if (!showSkeleton) {
    return null;
  }

  return <HistoryTableSkeleton className={className} rowCount={rowCount} />;
}
