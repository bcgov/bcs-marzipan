import { CORP_PACIFIC_TIME_ZONE, formatExactDate } from '@/lib/datetime-utils';

import type { ActivityTableRow } from '../activityTableRow';
import { ActivityDisplayIdCopy } from './ActivityDisplayIdCopy';
import { ActivityStatusCell } from './ActivityStatusCell';

export function LegacyOverviewCell({ row }: { row: ActivityTableRow }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 text-xs font-semibold text-slate-900">
      <span
        data-no-row-nav
        onClick={(event) => event.stopPropagation()}
        className="shrink-0 pl-1"
      >
        <ActivityDisplayIdCopy
          displayId={row.displayId ?? String(row.legacyId)}
          variant="subtle"
        />
      </span>
    </div>
  );
}

export function LegacyCommsCell({ row }: { row: ActivityTableRow }) {
  if (!row.leadOrg && !row.leadMinistry) {
    return <span className="text-slate-400">&mdash;</span>;
  }
  return (
    <div className="flex min-w-0 flex-col gap-0.5 text-[13px]">
      {row.leadOrg && <span>{row.leadOrg}</span>}
      {row.leadMinistry && (
        <span className="text-muted-foreground">{row.leadMinistry}</span>
      )}
    </div>
  );
}

export function LegacyStatusCell({ row }: { row: ActivityTableRow }) {
  const created = row.legacyCreatedDateTime
    ? new Date(row.legacyCreatedDateTime)
    : null;
  const hasCreated = created != null && !Number.isNaN(created.getTime());

  return (
    <div className="flex min-w-0 flex-col gap-1 text-xs">
      <ActivityStatusCell row={row} orientation="inline" />
      {hasCreated && created && (
        <span>
          Created{' '}
          {formatExactDate(created, {
            includeYear: true,
            timeZone: CORP_PACIFIC_TIME_ZONE,
          })}
        </span>
      )}
    </div>
  );
}
