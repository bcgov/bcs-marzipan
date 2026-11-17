import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  /** Rendered inline beside the title (e.g. date range on Look Ahead). */
  titleAddon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Reusable page header component with consistent styling.
 * Provides a title and optional action element.
 */
export function PageHeader({
  title,
  titleAddon,
  action,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {titleAddon}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
