import { Languages, NotebookText } from 'lucide-react';

import type { ActivityTableRow } from '../activityTableRow';
import { toSentenceCase } from '../activityTableRowDisplay';
import { OverflowTextList } from './OverflowTextList';

const MATERIALS_MAX_LINES = 2;

export interface MaterialsCellCompactProps {
  row: ActivityTableRow;
}

/**
 * Grid A materials column: comms materials and translation languages, each
 * capped to two wrapped lines with a plain "+N" overflow affordance.
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

  if (!hasMaterials && !hasLanguages && !showStatusLabel) {
    return <span className="text-slate-400">&mdash;</span>;
  }

  return (
    <div className="flex flex-col gap-1 text-[13px]">
      {hasMaterials && (
        <div className="flex items-start gap-1.5">
          <NotebookText
            size={16}
            strokeWidth={1.5}
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
          />
          <OverflowTextList
            items={row.commsMaterials}
            maxLines={MATERIALS_MAX_LINES}
            className="min-w-0 flex-1"
          />
        </div>
      )}

      {(hasLanguages || showStatusLabel) && (
        <div className="flex items-start gap-1.5">
          <Languages
            size={16}
            strokeWidth={1.5}
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
          />
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
