import type { ComponentProps } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type HistoryBadgeTriggerProps = {
  label: string;
  expanded?: boolean;
  className?: string;
} & Omit<ComponentProps<'button'>, 'children'>;

export function HistoryBadgeTrigger({
  label,
  expanded = false,
  className,
  ...props
}: HistoryBadgeTriggerProps) {
  return (
    <button
      type="button"
      className={cn(
        'focus-visible:ring-ring/50 inline-flex w-fit max-w-full shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0 py-1 outline-none focus-visible:ring-[3px]',
        className
      )}
      {...props}
    >
      <span
        data-active={expanded || undefined}
        className={cn(
          buttonVariants({
            variant: 'outline-primary',
            size: 'xs',
          }),
          'rounded-full px-2.5 shadow-none'
        )}
      >
        {label}
      </span>
    </button>
  );
}
