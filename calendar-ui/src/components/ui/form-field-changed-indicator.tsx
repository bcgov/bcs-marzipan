import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/**
 * Field-change marker: 18px yellow circle with inner black ring; on hover expands to a pill.
 * Variants share shape/behavior but keep independent semantics (aria-label / hover copy).
 */
export type FormFieldIndicatorVariant = 'changed' | 'review';

const INDICATOR_VARIANT_CONFIG: Record<
  FormFieldIndicatorVariant,
  { ariaLabel: string; hoverText: string; className: string }
> = {
  changed: {
    ariaLabel: 'Changed',
    hoverText: 'Changed',
    className: 'bg-status-yellow hover:bg-status-yellow/90',
  },
  review: {
    ariaLabel: 'Changed since last review',
    hoverText: 'Changed',
    className: 'bg-status-yellow hover:bg-status-yellow/90',
  },
};

type FormFieldIndicatorProps = HTMLAttributes<HTMLSpanElement> & {
  variant: FormFieldIndicatorVariant;
};

export function FormFieldIndicator({
  variant,
  className,
  ...props
}: FormFieldIndicatorProps) {
  const config = INDICATOR_VARIANT_CONFIG[variant];

  return (
    <span
      role="status"
      aria-label={config.ariaLabel}
      className={cn(
        'group relative inline-flex size-[18px] shrink-0 cursor-default items-center justify-center overflow-hidden rounded-full border border-transparent transition-[width] duration-200 ease-out outline-none',
        'hover:w-17',
        config.className,
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
        {config.hoverText}
      </span>
    </span>
  );
}
