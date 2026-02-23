import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const variants = {
  default: 'min-w-0 w-full mx-auto max-w-[96rem] px-12 py-8',
  narrow: 'min-w-0 mx-auto max-w-4xl',
} as const;

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof variants;
}

export function PageContainer({
  children,
  className,
  variant = 'default',
}: PageContainerProps) {
  return <div className={cn(variants[variant], className)}>{children}</div>;
}
