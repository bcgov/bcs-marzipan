import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface BooleanFilter {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
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
          {filters.map((filter) => (
            <label
              key={filter.id}
              className="flex cursor-pointer items-center gap-2 text-sm text-stone-500"
            >
              <Checkbox
                checked={filter.checked}
                onCheckedChange={(v) => filter.onCheckedChange(v === true)}
                aria-label={filter.label}
                className="border-stone-500"
              />
              {filter.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
