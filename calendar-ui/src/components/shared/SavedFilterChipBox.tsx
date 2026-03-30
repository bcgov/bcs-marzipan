import { X } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import type { ActivityFilterChipRow } from '@/lib/activity-filter-summary';
import { cn } from '@/lib/utils';

export type SavedFilterChipBoxProps = {
  rows: ActivityFilterChipRow[];
  /** Remove one filter value by its stable chip key. */
  onRemove?: (chipKey: string) => void;
  emptyPlaceholder?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * Bordered field with one row per filter type: label on the left, removable value chips on the right.
 */
export function SavedFilterChipBox({
  rows,
  onRemove,
  emptyPlaceholder = 'No filters applied.',
  className,
  disabled = false,
}: SavedFilterChipBoxProps): ReactElement {
  const editable = onRemove != null && !disabled;

  if (rows.length === 0) {
    return (
      <div
        className={cn(
          'border-input bg-muted/30 text-muted-foreground flex min-h-11 items-center rounded-md border px-3 py-2 text-sm',
          className
        )}
      >
        {emptyPlaceholder}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border-input bg-background ring-offset-background rounded-md border px-3 py-2 text-sm',
        editable &&
          'focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-2',
        className
      )}
      aria-label="Filter criteria"
    >
      <div className="flex max-h-[60vh] min-h-0 flex-col gap-3 overflow-y-auto">
        {rows.map((row) => (
          <div
            key={row.rowKey}
            className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:gap-3"
          >
            <div
              className={cn(
                'text-foreground shrink-0 text-left text-xs leading-normal font-medium sm:max-w-[min(12rem,40%)]',
                editable ? 'pt-[7px]' : 'pt-[3px]'
              )}
            >
              {row.label.endsWith(':') ? row.label : `${row.label}:`}
            </div>
            <div
              className="flex min-w-0 flex-1 flex-wrap content-start items-center justify-start gap-1.5"
              role="list"
              aria-label={row.label}
            >
              {row.chips.map((chip) => (
                <div
                  key={chip.chipKey}
                  role="listitem"
                  className="bg-muted border-border text-foreground inline-flex max-w-full shrink-0 items-center gap-0.5 rounded-md border px-2 py-[2px] text-xs"
                  title={chip.displayLabel}
                >
                  <span className="max-w-[min(100%,20rem)] min-w-0 wrap-break-word">
                    {chip.displayLabel}
                  </span>
                  {editable ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground size-6 shrink-0"
                      aria-label={`Remove ${chip.displayLabel}`}
                      onClick={() => onRemove(chip.chipKey)}
                    >
                      <X className="size-3.5" aria-hidden />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
