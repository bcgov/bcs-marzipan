import { BadgeGroup, type BadgeGroupItem } from '@/components/ui/badge-group';
import { cn } from '@/lib/utils';

import type { ActivityTableRow } from '../activityTableRow';
import {
  LIST_REVIEW_HIGHLIGHT_BG,
  rowHasChangedPath,
} from '../activityTableRowDisplay';

export interface CategoryCellProps {
  row: ActivityTableRow;
  showReviewHighlights: boolean;
}

/** Grid A overview column: categories as outline badges on a single line. */
export function CategoryBadgesCell({
  row,
  showReviewHighlights,
}: CategoryCellProps) {
  if (row.activityCategories.length === 0) return null;

  const categoriesChanged =
    showReviewHighlights && rowHasChangedPath(row, 'categoryIds');

  return (
    <BadgeGroup
      items={row.activityCategories.map(
        (category, index): BadgeGroupItem => ({
          key: `${category}:${index}`,
          label: category,
          variant: 'outline',
          className: cn(
            'h-auto min-h-5 whitespace-normal border-slate-200 text-slate-600',
            categoriesChanged && 'border-transparent',
            categoriesChanged && LIST_REVIEW_HIGHLIGHT_BG
          ),
        })
      )}
      maxLines={1}
      lineHeight={24}
      badgeVariant="outline"
      badgeClassName="h-auto min-h-5 whitespace-normal text-slate-600"
      containerClassName="gap-1"
    />
  );
}
