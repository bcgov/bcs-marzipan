import { ChevronDown, Plus } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

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
  addButtonLabel = 'Add new',
  children,
  className,
  isLoading = false,
  headerAction,
}: AdminSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const contentId = useId();

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white shadow-sm',
        className
      )}
    >
      <div className="border-b border-slate-200 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              aria-controls={contentId}
              aria-expanded={isOpen}
              onClick={() => setIsOpen((open) => !open)}
              className="flex w-full items-start gap-3 text-left focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'mt-0.5 h-5 w-5 shrink-0 text-slate-500 transition-transform',
                  !isOpen && '-rotate-90'
                )}
              />
              <span className="min-w-0">
                <span
                  role="heading"
                  aria-level={2}
                  className="block text-lg font-semibold text-slate-900 sm:text-xl"
                >
                  {title}
                </span>
                {description && (
                  <span className="mt-1 block text-sm text-slate-600">
                    {description}
                  </span>
                )}
              </span>
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {headerAction}
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
      {isOpen && (
        <div id={contentId} className="p-4 sm:p-6">
          {children}
        </div>
      )}
    </div>
  );
}
