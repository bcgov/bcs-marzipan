import { cn } from '@/lib/utils';

export interface ConfidentialIssueLabelsProps {
  isConfidential: boolean;
  isIssue: boolean;
  /** Stack labels vertically instead of inline. */
  orientation?: 'inline' | 'stacked';
  className?: string;
}

/**
 * CONFIDENTIAL / ISSUE markers. Each label is rendered only when the flag is
 * set, so rows stay short for the majority of activities.
 */
export function ConfidentialIssueLabels({
  isConfidential,
  isIssue,
  orientation = 'inline',
  className,
}: ConfidentialIssueLabelsProps) {
  if (!isConfidential && !isIssue) return null;

  return (
    <div
      className={cn(
        'text-corpcal-text-alert flex text-xs font-bold uppercase',
        orientation === 'stacked'
          ? 'flex-col gap-0'
          : 'flex-wrap items-center gap-x-2 gap-y-0',
        className
      )}
    >
      {isConfidential && <span>CONFIDENTIAL</span>}
      {isIssue && <span>ISSUE</span>}
    </div>
  );
}
