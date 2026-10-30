import * as React from 'react';

import { FORM_CONTROL_INVALID_RING_CLASS } from '@/lib/form-field-tokens';
import { READ_ONLY_STATIC_PLACEHOLDER } from '@/lib/read-only-static-field';
import { cn } from '@/lib/utils';

function Textarea({
  className,
  readOnly,
  placeholder,
  ...props
}: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        FORM_CONTROL_INVALID_RING_CLASS,
        readOnly && READ_ONLY_STATIC_PLACEHOLDER,
        readOnly &&
          'hover:border-input focus-visible:border-input shadow-none transition-none focus-visible:ring-0',
        className
      )}
      readOnly={readOnly}
      {...(placeholder !== '' ? { placeholder } : {})}
      {...props}
    />
  );
}

export { Textarea };
