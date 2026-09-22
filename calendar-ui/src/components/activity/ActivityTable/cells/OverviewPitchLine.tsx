import { cn } from '@/lib/utils';

import type { ActivityTableRow } from '../activityTableRow';
import {
  LIST_REVIEW_HIGHLIGHT_BG,
  rowHasAnyChangedPath,
  toSentenceCase,
} from '../activityTableRowDisplay';

export interface OverviewPitchLineProps {
  row: ActivityTableRow;
  canViewPitchStatus: boolean;
  showReviewHighlights: boolean;
  className?: string;
}

/**
 * Overview pitch status or date. Status is shown when the user can view it;
 * otherwise falls back to pitch date when present.
 */
export function OverviewPitchLine({
  row,
  canViewPitchStatus,
  showReviewHighlights,
  className,
}: OverviewPitchLineProps) {
  const pitchLabel =
    (canViewPitchStatus ? row.pitchRequiredStatus : null) ??
    row.pitchDate ??
    null;

  if (!pitchLabel) return null;

  const pitchChanged =
    showReviewHighlights &&
    rowHasAnyChangedPath(row, ['pitchDate', 'pitchRequiredStatusId']);

  return (
    <div
      className={cn(
        'text-[13px] text-slate-600',
        pitchChanged && 'inline-block rounded-sm px-1',
        pitchChanged && LIST_REVIEW_HIGHLIGHT_BG,
        className
      )}
    >
      Pitch: {toSentenceCase(pitchLabel)}
    </div>
  );
}
