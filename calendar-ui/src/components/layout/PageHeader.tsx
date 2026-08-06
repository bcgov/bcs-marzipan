import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Reusable page header component with consistent styling.
 * Provides a title and optional action element.
 */
export function PageHeader({ title, action, className = '' }: PageHeaderProps) {
  return (
    <div
      className={`${className} mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}
    >
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
