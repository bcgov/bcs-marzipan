import { useEffect, useMemo, useState } from 'react';

import {
  HISTORY_RECENCY_BUCKETS,
  pacificHistoryRecencyBucket,
} from '@/lib/datetime-utils';
import { cn } from '@/lib/utils';

import { historyDetailsHasDisclosure } from './history-details-label';
import type {
  HistoryEntryViewModel,
  HistoryListVariant,
} from './history-types';
import { HistoryEntry } from './HistoryEntry';

type HistoryListProps = {
  entries: HistoryEntryViewModel[];
  variant?: HistoryListVariant;
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

function entryHasInlineNotes(
  entry: HistoryEntryViewModel,
  variant: HistoryListVariant
): boolean {
  return variant === 'default' && Boolean(entry.notes?.trim());
}

function entryHasDisclosure(
  entry: HistoryEntryViewModel,
  variant: HistoryListVariant
): boolean {
  if (variant === 'compact') {
    return historyDetailsHasDisclosure(
      entry.changes.length,
      Boolean(entry.notes?.trim())
    );
  }
  return entry.changes.length > 0;
}

export function HistoryList({
  entries,
  variant = 'default',
  className,
}: HistoryListProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [expandedChanges, setExpandedChanges] = useState<Set<number>>(
    new Set()
  );

  const inlineNoteIds = useMemo(
    () =>
      entries
        .filter((entry) => entryHasInlineNotes(entry, variant))
        .map((entry) => entry.id),
    [entries, variant]
  );
  const disclosureIds = useMemo(
    () =>
      entries
        .filter((entry) => entryHasDisclosure(entry, variant))
        .map((entry) => entry.id),
    [entries, variant]
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

  const allInlineNotesExpanded =
    inlineNoteIds.length === 0 ||
    inlineNoteIds.every((id) => expandedNotes.has(id));
  const allDisclosuresExpanded =
    disclosureIds.length === 0 ||
    disclosureIds.every((id) => expandedChanges.has(id));
  const allExpanded = allInlineNotesExpanded && allDisclosuresExpanded;
  const hasExpandableContent =
    inlineNoteIds.length > 0 || disclosureIds.length > 0;

  const toggleAllExpanded = () => {
    if (allExpanded) {
      setExpandedNotes(new Set());
      setExpandedChanges(new Set());
      return;
    }
    setExpandedNotes(new Set(inlineNoteIds));
    setExpandedChanges(new Set(disclosureIds));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {hasExpandableContent ? (
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={toggleAllExpanded}
            className="text-primary text-xs font-medium hover:underline"
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      ) : null}

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
                variant={variant}
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
