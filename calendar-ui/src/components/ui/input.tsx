import * as React from 'react';

import { READ_ONLY_STATIC_PLACEHOLDER } from '@/lib/read-only-static-field';
import { cn } from '@/lib/utils';

function Input({
  className,
  type,
  readOnly,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-input selection:bg-primary selection:text-primary-foreground file:text-foreground placeholder:text-muted-foreground dark:bg-input/30 h-(--input-height) w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        readOnly && READ_ONLY_STATIC_PLACEHOLDER,
        readOnly &&
          'hover:border-input focus-visible:border-input shadow-none transition-none focus-visible:ring-0',
        className
      )}
      readOnly={readOnly}
      {...props}
    />
  );
}

export { Input };
