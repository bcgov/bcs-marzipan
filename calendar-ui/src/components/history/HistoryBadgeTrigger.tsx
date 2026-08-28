import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type HistoryBadgeTriggerProps = {
  label: string;
  expanded?: boolean;
  className?: string;
} & Omit<React.ComponentProps<'button'>, 'children'>;

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
        'group/trigger focus-visible:ring-ring/50 inline-flex w-fit max-w-full shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0 outline-none focus-visible:ring-[3px]',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          buttonVariants({ variant: 'default', size: 'xs' }),
          'rounded-full px-2.5',
          'group-hover/trigger:bg-primary/90',
          expanded && 'bg-primary/90'
        )}
      >
        {label}
      </span>
    </button>
  );
}
