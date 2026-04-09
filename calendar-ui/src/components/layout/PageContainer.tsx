import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Default page shell: max width + horizontal gutter. Keep `stripeFullBleedXClass` in sync
 * with `gutterXClass` (same horizontal spacing token on margin and padding).
 */
export const PAGE_CONTAINER_DEFAULT_LAYOUT = {
  maxWidthClass: 'max-w-[104rem]',
  gutterXClass: 'px-12',
  /**
   * Full-bleed within `PageContainer`’s horizontal padding: negative margin + explicit
   * `w-[calc(100%+6rem)]` (2× `spacing.12` / 3rem) so the border box spans the padding
   * box — `w-full` alone stays content-width and looks short/off-centre. Re-apply `px-12`
   * so inner content matches siblings. If `gutterXClass` changes, update the calc to 2× that gutter.
   */
  stripeFullBleedXClass: '-mx-12 w-[calc(100%+6rem)] max-w-none px-12',
} as const;

const variants = {
  default: cn(
    'min-w-0 w-full mx-auto py-8',
    PAGE_CONTAINER_DEFAULT_LAYOUT.maxWidthClass,
    PAGE_CONTAINER_DEFAULT_LAYOUT.gutterXClass
  ),
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
