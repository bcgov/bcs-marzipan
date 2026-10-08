import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function ContentSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      {children}
    </div>
  );
}
