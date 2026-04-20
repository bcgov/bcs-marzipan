import { useLayoutEffect, useRef, useState, type ReactElement } from 'react';

import { cn } from '@/lib/utils';

type CompleteActionButtonLabelProps = {
  isDirty: boolean;
  className?: string;
};

/**
 * Animated label for the complete action: width eases between "Complete" and
 * "Save and complete"; text crossfades. Inner content is aria-hidden; set
 * aria-label on the parent Button.
 */
export function CompleteActionButtonLabel({
  isDirty,
  className,
}: CompleteActionButtonLabelProps): ReactElement {
  const completeRef = useRef<HTMLSpanElement>(null);
  const saveCompleteRef = useRef<HTMLSpanElement>(null);
  const prevDirtyRef = useRef<boolean | undefined>(undefined);
  const [widthPx, setWidthPx] = useState<number | undefined>(undefined);

  const prevDirty = prevDirtyRef.current;
  const fadeInSaveAndComplete = prevDirty === false && isDirty;
  const fadeInComplete = prevDirty === true && !isDirty;

  useLayoutEffect(() => {
    const completeW = completeRef.current?.offsetWidth ?? 0;
    const saveCompleteW = saveCompleteRef.current?.offsetWidth ?? 0;
    const next = isDirty ? saveCompleteW : completeW;
    if (next > 0) {
      setWidthPx(next);
    }
    prevDirtyRef.current = isDirty;
  }, [isDirty]);

  return (
    <span
      className={cn(
        'relative inline-flex min-h-[1.25em] min-w-19 items-center justify-center overflow-hidden transition-[width,min-width] duration-300 ease-out motion-reduce:transition-none',
        widthPx != null && 'min-w-0',
        className
      )}
      style={widthPx != null ? { width: `${widthPx}px` } : undefined}
    >
      <span
        ref={completeRef}
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap transition-opacity duration-200 ease-out motion-reduce:transition-none motion-reduce:delay-0',
          isDirty
            ? 'pointer-events-none opacity-0'
            : cn(
                'opacity-100',
                fadeInComplete && 'delay-250 motion-reduce:delay-0'
              )
        )}
        aria-hidden
      >
        Complete
      </span>
      <span
        ref={saveCompleteRef}
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap transition-opacity duration-200 ease-out motion-reduce:transition-none',
          isDirty
            ? cn(
                'opacity-100',
                fadeInSaveAndComplete && 'delay-250 motion-reduce:delay-0'
              )
            : 'pointer-events-none opacity-0'
        )}
        aria-hidden
      >
        Save and complete
      </span>
    </span>
  );
}
