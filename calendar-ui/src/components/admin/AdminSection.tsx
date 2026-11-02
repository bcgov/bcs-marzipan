import { ChevronDown } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

import {
  useSettingsSectionOptional,
  type SettingsSectionId,
} from '@/contexts/SettingsSectionContext';
import { cn } from '@/lib/utils';

import { Button } from '../ui/button';

interface AdminSectionProps {
  title: string;
  description?: ReactNode;
  sectionId?: SettingsSectionId;
  defaultOpen?: boolean;
  onAdd?: () => void;
  addButtonLabel?: string;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  /** Rendered at the top of the expanded section body (filters, search, etc.). */
  headerAction?: ReactNode;
  /** Rendered at the top of the expanded section body, opposite primary actions. */
  titleAction?: ReactNode;
  /** Rendered at the bottom of the expanded section body (save, cancel, reset). */
  footerAction?: ReactNode;
}

/**
 * AdminSection - Reusable container for admin lookup sections
 *
 * Provides consistent styling and layout for administrative sections
 * with optional add button and custom section actions in the expandable body.
 */
export function AdminSection({
  title,
  description,
  sectionId,
  defaultOpen = false,
  onAdd,
  addButtonLabel = '+ Add item',
  children,
  className,
  isLoading = false,
  headerAction,
  titleAction,
  footerAction,
}: AdminSectionProps) {
  const settingsSection = useSettingsSectionOptional();
  const isContextManaged = sectionId != null && settingsSection != null;
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const contentId = useId();

  const isOpen = isContextManaged
    ? settingsSection.isSectionOpen(sectionId)
    : localOpen;

  const handleToggle = () => {
    if (isContextManaged) {
      settingsSection.toggleSection(sectionId);
      return;
    }
    setLocalOpen((open) => !open);
  };

  const hasSectionActions = Boolean(headerAction || onAdd || titleAction);

  return (
    <div
      className={cn('rounded-lg border border-slate-200 bg-white', className)}
    >
      <div className="p-4 sm:p-6">
        <button
          type="button"
          data-state={isOpen ? 'open' : 'closed'}
          aria-controls={contentId}
          aria-expanded={isOpen}
          onClick={handleToggle}
          className="flex min-h-10 w-full items-center justify-between gap-4 text-left focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none [&[data-state=open]_[data-slot=admin-section-chevron]]:rotate-180"
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
            <span
              role="heading"
              aria-level={2}
              className="shrink-0 text-lg font-semibold text-slate-900"
            >
              {title}
            </span>
            {description && (
              <span className="min-w-0 text-sm font-normal text-slate-600 sm:max-w-[min(100%,42rem)]">
                {description}
              </span>
            )}
          </span>
          <span
            data-slot="admin-section-chevron"
            className="inline-flex shrink-0 text-slate-500 transition-transform duration-200 ease-in-out"
          >
            <ChevronDown
              size={20}
              strokeWidth={2}
              aria-hidden="true"
              className="size-5"
            />
          </span>
        </button>
      </div>
      <div id={contentId} hidden={!isOpen} className="p-4 sm:p-6">
        {hasSectionActions && (
          <div
            className={cn(
              'mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center',
              titleAction ? 'sm:justify-between' : 'sm:justify-end'
            )}
          >
            {titleAction && (
              <div className="flex shrink-0 items-center">{titleAction}</div>
            )}
            {(headerAction || onAdd) && (
              <div className="flex flex-wrap items-center justify-end gap-3 sm:ml-auto">
                {headerAction}
                {onAdd && (
                  <Button onClick={onAdd} disabled={isLoading} size="lg">
                    {addButtonLabel}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
        {children}
        {footerAction && (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-3 sm:mt-6">
            {footerAction}
          </div>
        )}
      </div>
    </div>
  );
}
