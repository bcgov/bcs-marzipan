import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/**
 * Dirty-field marker: 18px yellow circle with inner black ring; on hover expands to a pill
 * with 11px "Changed" text (activity Changed colour).
 */
export function FormFieldChangedIndicator({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      role="status"
      aria-label="Changed"
      className={cn(
        'group bg-status-yellow hover:bg-status-yellow/90 relative inline-flex size-[18px] shrink-0 cursor-default items-center justify-center overflow-hidden rounded-full border border-transparent transition-[width] duration-200 ease-out outline-none',
        'hover:w-17',
        className
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-100 transition-opacity duration-200 ease-out group-hover:opacity-0"
        aria-hidden
      >
        <span className="box-border size-2.5 shrink-0 rounded-full border border-black bg-transparent" />
      </span>
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center px-2 text-[11px] leading-none font-normal whitespace-nowrap text-slate-900 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
        aria-hidden
      >
        Changed
      </span>
    </span>
  );
}
