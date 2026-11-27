import type { ActivityTableRow } from '../activityTableRow';
import { ActivityDisplayIdCopy } from './ActivityDisplayIdCopy';
import { ActivityStatusCell } from './ActivityStatusCell';
import { ActivityTimestampsCell } from './ActivityTimestampsCell';

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

export function LegacyStatusCell({ row }: { row: ActivityTableRow }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 text-xs">
      <ActivityStatusCell row={row} orientation="inline" />
      <ActivityTimestampsCell
        row={row}
        userMap={new Map()}
        showUpdatedByAvatar={false}
        showUpdatedTimestamp={false}
      />
    </div>
  );
}
