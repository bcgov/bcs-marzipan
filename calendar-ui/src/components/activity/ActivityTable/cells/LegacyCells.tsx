import { Badge } from '@/components/ui/badge';
import { CORP_PACIFIC_TIME_ZONE, formatExactDate } from '@/lib/datetime-utils';

import type { ActivityTableRow } from '../activityTableRow';

export function LegacyOverviewCell({ row }: { row: ActivityTableRow }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <Badge variant="secondary">Legacy</Badge>
      <span className="text-muted-foreground text-xs wrap-anywhere">
        {row.legacySourceLabel}
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
  const imported = new Date(row.createdDateTime);
  const hasImported = imported.getTime() > 0;

  return (
    <div className="flex min-w-0 flex-col gap-1 text-xs">
      <div className="flex flex-wrap items-center gap-1">
        <Badge variant="secondary">{row.activityStatus}</Badge>
        {row.lookAheadStatus && (
          <Badge variant="outline">{row.lookAheadStatus}</Badge>
        )}
      </div>
      {hasImported && (
        <span>
          Imported{' '}
          {formatExactDate(imported, {
            includeYear: true,
            timeZone: CORP_PACIFIC_TIME_ZONE,
          })}
        </span>
      )}
    </div>
  );
}
