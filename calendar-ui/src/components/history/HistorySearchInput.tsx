import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type HistorySearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
};

export function HistorySearchInput({
  value,
  onChange,
  placeholder = 'Search',
  ariaLabel = 'Search history',
  className,
}: HistorySearchInputProps) {
  return (
    <div className={cn('relative max-w-md min-w-[240px] shrink-0', className)}>
      <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pr-8 pl-8 shadow-none"
        aria-label={ariaLabel}
      />
      {value ? (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
