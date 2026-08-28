import { useEffect, useMemo, useState } from 'react';

import {
  HISTORY_RECENCY_BUCKETS,
  pacificHistoryRecencyBucket,
} from '@/lib/datetime-utils';
import { cn } from '@/lib/utils';

import type { HistoryEntryViewModel } from './history-types';
import { HistoryEntry } from './HistoryEntry';

type HistoryListProps = {
  entries: HistoryEntryViewModel[];
  className?: string;
};

function updateIdSet(
  current: Set<number>,
  id: number,
  expanded: boolean
): Set<number> {
  const next = new Set(current);
  if (expanded) next.add(id);
  else next.delete(id);
  return next;
}

function pruneIdSet(current: Set<number>, validIds: Set<number>): Set<number> {
  const next = new Set([...current].filter((id) => validIds.has(id)));
  if (next.size === current.size && [...next].every((id) => current.has(id))) {
    return current;
  }
  return next;
}

export function HistoryList({ entries, className }: HistoryListProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [expandedChanges, setExpandedChanges] = useState<Set<number>>(
    new Set()
  );

  const noteIds = useMemo(
    () => entries.filter((entry) => entry.notes).map((entry) => entry.id),
    [entries]
  );
  const changeIds = useMemo(
    () =>
      entries
        .filter((entry) => entry.changes.length > 0)
        .map((entry) => entry.id),
    [entries]
  );
  const validIds = useMemo(
    () => new Set(entries.map((entry) => entry.id)),
    [entries]
  );

  useEffect(() => {
    setExpandedNotes((current) => pruneIdSet(current, validIds));
    setExpandedChanges((current) => pruneIdSet(current, validIds));
  }, [validIds]);

  const groups = useMemo(() => {
    const grouped = new Map(
      HISTORY_RECENCY_BUCKETS.map((bucket) => [
        bucket,
        [] as HistoryEntryViewModel[],
      ])
    );
    const now = new Date();
    entries.forEach((entry) => {
      const bucket = pacificHistoryRecencyBucket(
        new Date(entry.timestamp),
        now
      );
      grouped.get(bucket)?.push(entry);
    });
    return HISTORY_RECENCY_BUCKETS.map(
      (bucket) => [bucket, grouped.get(bucket) ?? []] as const
    ).filter(([, bucketEntries]) => bucketEntries.length > 0);
  }, [entries]);

  const allNotesExpanded =
    noteIds.length > 0 && noteIds.every((id) => expandedNotes.has(id));
  const allChangesExpanded =
    changeIds.length > 0 && changeIds.every((id) => expandedChanges.has(id));

  return (
    <div className={cn('space-y-4', className)}>
      {(noteIds.length > 0 || changeIds.length > 0) && (
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          {noteIds.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setExpandedNotes(
                  allNotesExpanded ? new Set() : new Set(noteIds)
                )
              }
              className="text-primary text-xs font-medium hover:underline"
            >
              {allNotesExpanded ? 'Collapse all notes' : 'Expand all notes'}
            </button>
          )}
          {changeIds.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setExpandedChanges(
                  allChangesExpanded ? new Set() : new Set(changeIds)
                )
              }
              className="text-primary text-xs font-medium hover:underline"
            >
              {allChangesExpanded
                ? 'Collapse all changes'
                : 'Expand all changes'}
            </button>
          )}
        </div>
      )}

      {groups.map(([heading, groupEntries]) => (
        <section key={heading} aria-labelledby={`history-${heading}`}>
          <h2
            id={`history-${heading}`}
            className="text-muted-foreground border-border mb-1 border-b pb-1 text-xs font-semibold tracking-wide uppercase"
          >
            {heading}
          </h2>
          <div className="space-y-1">
            {groupEntries.map((entry) => (
              <HistoryEntry
                key={entry.id}
                entry={entry}
                notesExpanded={expandedNotes.has(entry.id)}
                changesExpanded={expandedChanges.has(entry.id)}
                onNotesExpandedChange={(expanded) =>
                  setExpandedNotes((current) =>
                    updateIdSet(current, entry.id, expanded)
                  )
                }
                onChangesExpandedChange={(expanded) =>
                  setExpandedChanges((current) =>
                    updateIdSet(current, entry.id, expanded)
                  )
                }
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
