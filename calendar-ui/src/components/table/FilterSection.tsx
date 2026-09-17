import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function FilterSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-2 flex flex-col gap-1 [&>:nth-child(3)]:-mt-1',
        className
      )}
    >
      {children}
    </div>
  );
}

/** Row below primary filters for quick picks and optional trailing actions. */
export function FilterSectionActionsRow({
  leading,
  trailing,
  className,
}: {
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  if (!leading && !trailing) {
    return null;
  }

  return (
    <div
      className={cn('flex h-9 items-center justify-between gap-4', className)}
    >
      <div className="flex min-w-0 items-center">{leading}</div>
      {trailing ? (
        <div className="flex shrink-0 items-center gap-4">{trailing}</div>
      ) : null}
    </div>
  );
}
