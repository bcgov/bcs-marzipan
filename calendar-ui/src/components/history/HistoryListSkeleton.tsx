import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { HISTORY_LIST_CONTENT_CLASSNAME } from './history-list-layout';

const SKELETON_DELAY_MS = 300;
const SKELETON_ENTRY_COUNT = 4;

function HistoryEntrySkeleton() {
  return (
    <div className="border-border flex items-start gap-3 rounded-md border px-2 py-1.5">
      <Skeleton className="size-6 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16 rounded-full" />
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
      className={cn('space-y-4', HISTORY_LIST_CONTENT_CLASSNAME, className)}
      aria-hidden="true"
    >
      <Skeleton className="h-4 w-14" />
      <div className="space-y-2">
        {Array.from({ length: entryCount }, (_, index) => (
          <HistoryEntrySkeleton key={index} />
        ))}
      </div>
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
