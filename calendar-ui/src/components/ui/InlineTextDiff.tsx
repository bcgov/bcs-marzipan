import { REVIEW_HIGHLIGHT_BG } from '@/lib/review-highlight';
import {
  buildTextDiffSegments,
  segmentsForSide,
  type TextDiffSide,
} from '@/lib/text-diff';
import { cn } from '@/lib/utils';

type InlineTextDiffProps = {
  oldValue: string;
  newValue: string;
  mode: 'words';
  side: TextDiffSide;
  className?: string;
};

export function InlineTextDiff({
  oldValue,
  newValue,
  side,
  className,
}: InlineTextDiffProps) {
  const segments = segmentsForSide(
    buildTextDiffSegments(oldValue, newValue),
    side
  );

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'delete') {
          return (
            <del key={index} className="text-destructive line-through">
              {segment.value}
            </del>
          );
        }

        if (segment.type === 'insert') {
          return (
            <ins
              key={index}
              className={cn(
                'rounded-sm px-0.5 no-underline',
                REVIEW_HIGHLIGHT_BG
              )}
            >
              {segment.value}
            </ins>
          );
        }

        return (
          <span
            key={index}
            className={side === 'old' ? 'text-muted-foreground' : undefined}
          >
            {segment.value}
          </span>
        );
      })}
    </span>
  );
}
