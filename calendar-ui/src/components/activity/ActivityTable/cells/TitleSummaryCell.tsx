import { useEffect, useRef, useState } from 'react';

import { ActivityRichTextContent } from '@/components/ui/activity-rich-text-content';
import { cn } from '@/lib/utils';

import type { ActivityTableRow } from '../activityTableRow';
import {
  LIST_REVIEW_HIGHLIGHT_BG,
  rowHasChangedPath,
} from '../activityTableRowDisplay';

const SUMMARY_MAX_LINES = 2;
const SUMMARY_LINE_HEIGHT_PX = 20;

function summaryContentNeedsTruncation(el: HTMLDivElement): boolean {
  const maxHeight = SUMMARY_LINE_HEIGHT_PX * SUMMARY_MAX_LINES;
  return el.scrollHeight > maxHeight + 1 || el.scrollWidth > el.clientWidth + 1;
}

export interface TitleSummaryCellProps {
  row: ActivityTableRow;
  showReviewHighlights: boolean;
}

/**
 * Grid A summary column: title clamped to two lines above a two-line summary
 * with a "Show more" toggle. Keeps rows short while leaving full text reachable.
 */
export function TitleSummaryCell({
  row,
  showReviewHighlights,
}: TitleSummaryCellProps) {
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const showMoreLessRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setNeedsTruncation(summaryContentNeedsTruncation(el));
    }
  }, [row.summary]);

  useEffect(() => {
    if (expanded && needsTruncation) {
      showMoreLessRef.current?.focus();
    }
  }, [expanded, needsTruncation]);

  const titleChanged = showReviewHighlights && rowHasChangedPath(row, 'title');
  const summaryChanged =
    showReviewHighlights && rowHasChangedPath(row, 'summary');
  const isCollapsedWithTruncation = needsTruncation && !expanded;

  const showMoreLessButton = (
    <button
      ref={showMoreLessRef}
      type="button"
      data-no-row-nav
      aria-expanded={expanded}
      onClick={(e) => {
        e.stopPropagation();
        setExpanded(!expanded);
      }}
      className="-m-2 cursor-pointer border-none bg-transparent p-2 text-[12px] font-normal text-(--fluent-primary)"
    >
      {expanded ? 'Show less' : 'Show more'}
    </button>
  );

  const showConfidential = row.isConfidential;
  const showIssue = row.isIssue;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'line-clamp-2 text-[14px] leading-tight font-semibold wrap-anywhere text-slate-900',
          titleChanged && 'rounded-sm px-1',
          titleChanged && LIST_REVIEW_HIGHLIGHT_BG
        )}
        title={row.title}
      >
        {showConfidential && (
          <span className="text-corpcal-text-alert uppercase">
            CONFIDENTIAL{' '}
          </span>
        )}
        {showIssue && (
          <span className="text-corpcal-text-alert uppercase">ISSUE </span>
        )}
        {row.title}
      </div>

      <div
        className={
          isCollapsedWithTruncation ? 'relative min-h-[1.4em]' : undefined
        }
      >
        <div
          ref={contentRef}
          className={cn(
            'text-[13px] leading-[1.4] wrap-anywhere',
            summaryChanged && 'rounded-sm px-1',
            summaryChanged && LIST_REVIEW_HIGHLIGHT_BG,
            !expanded && 'line-clamp-2'
          )}
        >
          <ActivityRichTextContent value={row.summary} stopLinkPropagation />
        </div>

        {needsTruncation &&
          (isCollapsedWithTruncation ? (
            <span className="absolute right-0 bottom-0 w-28 group-hover/row:bg-[linear-gradient(to_right,transparent_0%,rgb(248_250_252/0.5)_35%,rgb(248_250_252/0.5)_100%)]">
              <span className="flex justify-end bg-[linear-gradient(to_right,transparent_0%,white_35%,white_100%)] whitespace-nowrap [&>button]:inline">
                {showMoreLessButton}
              </span>
            </span>
          ) : (
            <div className="mt-1 flex justify-end">{showMoreLessButton}</div>
          ))}
      </div>
    </div>
  );
}
