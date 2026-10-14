import { ListChevronsDownUp, ListChevronsUpDown } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

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
  children?: (parts: { expandAll: ReactNode; groups: ReactNode }) => ReactNode;
};

const expandAllButtonClassName =
  'text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-normal transition-colors outline-none focus-visible:ring-[3px]';

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
  children,
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

  const expandAllButton = hasExpandableContent ? (
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

  const entryList = entries.map((entry) => (
    <HistoryEntry
      key={entry.id}
      entry={entry}
      variant={variant}
      notesExpanded={expandedNotes.has(entry.id)}
      changesExpanded={expandedChanges.has(entry.id)}
      onNotesExpandedChange={(expanded) =>
        setExpandedNotes((current) => updateIdSet(current, entry.id, expanded))
      }
      onChangesExpandedChange={(expanded) =>
        setExpandedChanges((current) =>
          updateIdSet(current, entry.id, expanded)
        )
      }
    />
  ));

  const groupsNode = (
    <div className={cn('space-y-2', className)}>{entryList}</div>
  );

  if (children) {
    return children({ expandAll: expandAllButton, groups: groupsNode });
  }

  return (
    <div className={cn('space-y-4', className)}>
      {expandAllButton ? (
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          {expandAllButton}
        </div>
      ) : null}
      <div className="space-y-2">{entryList}</div>
    </div>
  );
}
