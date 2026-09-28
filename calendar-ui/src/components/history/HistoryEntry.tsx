import { Link } from 'react-router-dom';

import type {
  HistoryEntryViewModel,
  HistoryListVariant,
} from './history-types';
import { HistoryChangeList } from './HistoryChangeList';
import { HistoryNote } from './HistoryNote';
import { HistoryRecencyDateTime } from './HistoryRecencyDateTime';

type HistoryEntryProps = {
  entry: HistoryEntryViewModel;
  variant?: HistoryListVariant;
  notesExpanded: boolean;
  changesExpanded: boolean;
  onNotesExpandedChange: (expanded: boolean) => void;
  onChangesExpandedChange: (expanded: boolean) => void;
};

function HistorySubjectLine({ entry }: { entry: HistoryEntryViewModel }) {
  if (!entry.subject) return null;

  return (
    <>
      <span className="text-muted-foreground">{entry.actionLabel}</span>{' '}
      {entry.subject.href ? (
        <Link
          to={entry.subject.href}
          state={entry.subject.state}
          className="text-primary font-medium hover:underline"
        >
          {entry.subject.label}
        </Link>
      ) : (
        <span className="text-foreground font-medium">
          {entry.subject.label}
        </span>
      )}
      {entry.subject.title ? (
        <span className="text-foreground ml-2">{entry.subject.title}</span>
      ) : null}
    </>
  );
}

export function HistoryEntry({
  entry,
  variant = 'default',
  notesExpanded,
  changesExpanded,
  onNotesExpandedChange,
  onChangesExpandedChange,
}: HistoryEntryProps) {
  const isCompact = variant === 'compact';

  return (
    <article className="bg-background border-border min-w-0 rounded-md border px-2 py-1.5">
      <div className="@container min-w-0">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2 gap-y-0.5 text-sm leading-5 @md:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="col-start-1 row-start-1 min-w-0">
            <span
              className="text-foreground block truncate font-medium"
              title={entry.actor.name}
            >
              {entry.actor.name}
            </span>
            {entry.team ? (
              <span
                className="text-muted-foreground block truncate text-xs"
                title={entry.team}
              >
                {entry.team}
              </span>
            ) : null}
            {!entry.subject ? (
              <span className="text-muted-foreground block">
                {entry.actionLabel}
              </span>
            ) : null}
          </div>
          {entry.subject ? (
            <span className="text-foreground col-span-2 col-start-1 row-start-2 block min-w-0 truncate @md:col-span-1 @md:col-start-2 @md:row-start-1">
              <HistorySubjectLine entry={entry} />
            </span>
          ) : null}
          <HistoryRecencyDateTime
            timestamp={entry.timestamp}
            className="col-start-2 row-start-1 shrink-0 @md:col-start-3"
          />
        </div>

        {!isCompact && entry.notes ? (
          <HistoryNote
            text={entry.notes}
            expanded={notesExpanded}
            onExpandedChange={onNotesExpandedChange}
          />
        ) : null}

        <HistoryChangeList
          changes={entry.changes}
          note={isCompact ? entry.notes : undefined}
          expanded={changesExpanded}
          onExpandedChange={onChangesExpandedChange}
        />
      </div>
    </article>
  );
}
