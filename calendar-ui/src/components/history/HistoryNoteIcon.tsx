import { NotebookPen } from 'lucide-react';

import { cn } from '@/lib/utils';

type HistoryNoteIconProps = {
  className?: string;
};

export function HistoryNoteIcon({ className }: HistoryNoteIconProps) {
  return (
    <span
      className={cn(
        'bg-primary/10 text-primary inline-flex size-5 shrink-0 items-center justify-center rounded-full',
        className
      )}
      aria-hidden
    >
      <NotebookPen className="size-3" strokeWidth={2} />
    </span>
  );
}

export function HistoryNoteLeading({ className }: HistoryNoteIconProps) {
  return (
    <span className={cn('flex h-5 shrink-0 items-center', className)}>
      <HistoryNoteIcon />
    </span>
  );
}
