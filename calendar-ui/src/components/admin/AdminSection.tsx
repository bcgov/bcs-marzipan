import { ArrowUp, Plus } from 'lucide-react';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { Button } from '../ui/button';

interface AdminSectionProps {
  title: string;
  description?: string;
  onAdd?: () => void;
  addButtonLabel?: string;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  headerAction?: ReactNode;
}

/**
 * AdminSection - Reusable container for admin lookup sections
 *
 * Provides consistent styling and layout for administrative sections
 * with optional add button and custom header actions.
 */
export function AdminSection({
  title,
  description,
  onAdd,
  addButtonLabel = 'Add New',
  children,
  className,
  isLoading = false,
  headerAction,
}: AdminSectionProps) {
  const scrollToTop = () => {
    document.getElementById('quick-navigation')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white shadow-sm',
        className
      )}
    >
      <div className="border-b border-slate-200 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {headerAction}
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 text-sm text-slate-600 transition-colors hover:text-slate-900"
            >
              <ArrowUp className="h-4 w-4" />
              <span className="hidden sm:inline">Back to quick navigation</span>
            </button>
            {onAdd && (
              <Button
                onClick={onAdd}
                disabled={isLoading}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {addButtonLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}
