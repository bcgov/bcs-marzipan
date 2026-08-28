import { Link } from 'react-router-dom';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CORP_PACIFIC_TIME_ZONE, formatExactDate } from '@/lib/datetime-utils';

import { historyActorInitials } from './history-format';
import type {
  HistoryEntryViewModel,
  HistoryListVariant,
} from './history-types';
import { HistoryChangeList } from './HistoryChangeList';
import { HistoryNote } from './HistoryNote';

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
  const timestamp = new Date(entry.timestamp);
  const formattedTimestamp = Number.isNaN(timestamp.getTime())
    ? ''
    : formatExactDate(timestamp, {
        includeTime: true,
        timeZone: CORP_PACIFIC_TIME_ZONE,
        appendPacificTimeAbbrev: true,
      });

  return (
    <article className="bg-background flex min-w-0 items-start gap-3 rounded-md py-2">
      <Avatar size="sm" title={entry.actor.name} className="mt-0.5">
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {historyActorInitials(entry.actor)}
        </AvatarFallback>
      </Avatar>

      <div className="@container min-w-0 flex-1">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2 gap-y-0.5 text-sm leading-5 @md:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="col-start-1 row-start-1 flex min-w-0 items-baseline gap-x-2 overflow-hidden">
            <span className="text-foreground shrink-0 font-medium">
              {entry.actor.name}
            </span>
            {entry.team ? (
              <Badge variant="outline-subtle" className="shrink-0">
                {entry.team}
              </Badge>
            ) : null}
            {!entry.subject ? (
              <span className="text-muted-foreground shrink-0">
                {entry.actionLabel}
              </span>
            ) : null}
          </div>
          {entry.subject ? (
            <span className="text-foreground col-span-2 col-start-1 row-start-2 block min-w-0 truncate @md:col-span-1 @md:col-start-2 @md:row-start-1">
              <HistorySubjectLine entry={entry} />
            </span>
          ) : null}
          {formattedTimestamp ? (
            <time
              dateTime={entry.timestamp}
              className="text-muted-foreground col-start-2 row-start-1 shrink-0 text-xs sm:text-sm @md:col-start-3"
            >
              {formattedTimestamp}
            </time>
          ) : null}
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
