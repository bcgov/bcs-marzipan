import { Languages, NotebookText } from 'lucide-react';

import type { ActivityTableRow } from '../activityTableRow';
import { toSentenceCase } from '../activityTableRowDisplay';
import { ACTIVITY_GRID_ROW_ICON_TOP_CLASS } from './activityGridRowIcons';
import { LeadContactLine } from './LeadContactLine';
import { OverflowTextList } from './OverflowTextList';

const MATERIALS_MAX_LINES = 2;

export interface MaterialsCellCompactProps {
  row: ActivityTableRow;
}

/**
 * Grid A Comms column: comms lead, materials, and translation languages.
 */
export function MaterialsCellCompact({ row }: MaterialsCellCompactProps) {
  const status = row.translationsRequiredStatus;
  const languages = row.translationsRequired.map((s) => s.toUpperCase());
  const hasLanguages = languages.length > 0;
  const hasMaterials = row.commsMaterials.length > 0;

  const statusLower = status?.toLowerCase();
  const showStatusLabel =
    status != null &&
    (!hasLanguages ||
      statusLower === 'pending review' ||
      statusLower === 'not required');

  const hasCommsLead = row.commsLeadName != null;

  if (!hasMaterials && !hasLanguages && !showStatusLabel && !hasCommsLead) {
    return <span className="text-slate-400">&mdash;</span>;
  }

  return (
    <div className="flex flex-col gap-1 text-[13px]">
      {hasCommsLead && (
        <LeadContactLine row={row} variant="labelled" className="text-[13px]" />
      )}
      {hasMaterials && (
        <div className="flex items-start gap-1.5">
          <NotebookText className={ACTIVITY_GRID_ROW_ICON_TOP_CLASS} />
          <OverflowTextList
            items={row.commsMaterials}
            maxLines={MATERIALS_MAX_LINES}
            className="min-w-0 flex-1"
          />
        </div>
      )}

      {(hasLanguages || showStatusLabel) && (
        <div className="flex items-start gap-1.5">
          <Languages className={ACTIVITY_GRID_ROW_ICON_TOP_CLASS} />
          <div className="flex min-w-0 flex-1 flex-col gap-0">
            {showStatusLabel && status && (
              <span className="text-slate-600">{toSentenceCase(status)}</span>
            )}
            {hasLanguages && (
              <OverflowTextList
                items={languages}
                maxLines={MATERIALS_MAX_LINES}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
