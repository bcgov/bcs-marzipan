import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface BooleanFilter {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** When true, checkbox is disabled and not editable. */
  disabled?: boolean;
  /** Shown only when disabled is true; directs user why the control is disabled. */
  disabledTooltip?: string;
}

interface TableSummaryBarProps {
  count: number;
  singularLabel: string;
  pluralLabel?: string;
  filters?: BooleanFilter[];
  className?: string;
}

export function TableSummaryBar({
  count,
  singularLabel,
  pluralLabel,
  filters = [],
  className,
}: TableSummaryBarProps) {
  const label =
    count === 1 ? singularLabel : (pluralLabel ?? singularLabel + 's');

  return (
    <div
      className={cn(
        'mb-2 flex flex-wrap items-center justify-between gap-4 text-sm text-stone-500',
        className
      )}
    >
      <span>
        Showing {count} {label}
      </span>
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          {filters.map((filter) => {
            const isDisabled = filter.disabled === true;
            const labelClassName = cn(
              'flex items-center gap-2 text-sm text-stone-500',
              isDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
            );
            const labelContent = (
              <>
                <Checkbox
                  checked={filter.checked}
                  onCheckedChange={(v) => filter.onCheckedChange(v === true)}
                  aria-label={filter.label}
                  className="border-stone-500"
                  disabled={isDisabled}
                />
                {filter.label}
              </>
            );
            return (
              <span key={filter.id}>
                {isDisabled && filter.disabledTooltip ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className={labelClassName}>{labelContent}</label>
                    </TooltipTrigger>
                    <TooltipContent>{filter.disabledTooltip}</TooltipContent>
                  </Tooltip>
                ) : (
                  <label className={labelClassName}>{labelContent}</label>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
