import * as React from 'react';

import { READ_ONLY_STATIC_PLACEHOLDER } from '@/lib/read-only-static-field';
import { cn } from '@/lib/utils';

function Textarea({
  className,
  readOnly,
  ...props
}: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
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

export { Textarea };
