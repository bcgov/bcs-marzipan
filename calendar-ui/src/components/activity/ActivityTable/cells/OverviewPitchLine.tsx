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
 * Pitch status or date (no label prefix). Shown in the status column above
 * last updated. Status when the user can view it; otherwise pitch date.
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
        'w-fit max-w-full text-xs text-slate-600',
        pitchChanged && 'rounded-sm px-1',
        pitchChanged && LIST_REVIEW_HIGHLIGHT_BG,
        className
      )}
    >
      {toSentenceCase(pitchLabel)}
    </div>
  );
}
