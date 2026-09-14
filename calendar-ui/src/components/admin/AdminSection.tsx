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
  sectionId,
  defaultOpen = false,
  onAdd,
  addButtonLabel = 'Add new',
  children,
  className,
  isLoading = false,
  headerAction,
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
              onClick={handleToggle}
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
      <div id={contentId} hidden={!isOpen} className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}
