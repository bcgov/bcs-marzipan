import { ChevronDown, Plus } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

import {
  useSettingsSectionOptional,
  type SettingsSectionId,
} from '@/contexts/SettingsSectionContext';
import { cn } from '@/lib/utils';

import { Button } from '../ui/button';

interface AdminSectionProps {
  title: string;
  description?: string;
  sectionId?: SettingsSectionId;
  defaultOpen?: boolean;
  onAdd?: () => void;
  addButtonLabel?: string;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  /** Rendered at the top of the expanded section body (filters, save, etc.). */
  headerAction?: ReactNode;
  /** Rendered at the top of the expanded section body, opposite primary actions. */
  titleAction?: ReactNode;
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
  addButtonLabel = 'Add new',
  children,
  className,
  isLoading = false,
  headerAction,
  titleAction,
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
      className={cn(
        'rounded-lg border border-slate-200 bg-white shadow-sm',
        className
      )}
    >
      <div className={cn('p-4 sm:p-6', isOpen && 'border-b border-slate-200')}>
        <button
          type="button"
          aria-controls={contentId}
          aria-expanded={isOpen}
          onClick={handleToggle}
          className="flex w-full items-center justify-between gap-4 text-left focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              role="heading"
              aria-level={2}
              className="shrink-0 text-lg font-semibold text-slate-900 sm:text-xl"
            >
              {title}
            </span>
            {description && (
              <span className="min-w-0 text-sm font-normal text-slate-600 sm:max-w-[min(100%,28rem)]">
                {description}
              </span>
            )}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'h-5 w-5 shrink-0 text-slate-500 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
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
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
