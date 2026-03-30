import { useLayoutEffect, useRef, useState, type ReactElement } from 'react';

import { cn } from '@/lib/utils';

type ReviewActionButtonLabelProps = {
  isDirty: boolean;
  className?: string;
};

/**
 * Animated label for the review action: width eases between "Review" and
 * "Save and Review"; text crossfades. Inner content is aria-hidden; set
 * aria-label on the parent Button.
 */
export function ReviewActionButtonLabel({
  isDirty,
  className,
}: ReviewActionButtonLabelProps): ReactElement {
  const reviewRef = useRef<HTMLSpanElement>(null);
  const saveReviewRef = useRef<HTMLSpanElement>(null);
  const prevDirtyRef = useRef<boolean | undefined>(undefined);
  const [widthPx, setWidthPx] = useState<number | undefined>(undefined);

  const prevDirty = prevDirtyRef.current;
  const fadeInSaveAndReview = prevDirty === false && isDirty;
  const fadeInReview = prevDirty === true && !isDirty;

  useLayoutEffect(() => {
    const reviewW = reviewRef.current?.offsetWidth ?? 0;
    const saveReviewW = saveReviewRef.current?.offsetWidth ?? 0;
    const next = isDirty ? saveReviewW : reviewW;
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
        ref={reviewRef}
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap transition-opacity duration-200 ease-out motion-reduce:transition-none motion-reduce:delay-0',
          isDirty
            ? 'pointer-events-none opacity-0'
            : cn(
                'opacity-100',
                fadeInReview && 'delay-250 motion-reduce:delay-0'
              )
        )}
        aria-hidden
      >
        Review
      </span>
      <span
        ref={saveReviewRef}
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap transition-opacity duration-200 ease-out motion-reduce:transition-none',
          isDirty
            ? cn(
                'opacity-100',
                fadeInSaveAndReview && 'delay-250 motion-reduce:delay-0'
              )
            : 'pointer-events-none opacity-0'
        )}
        aria-hidden
      >
        Save and review
      </span>
    </span>
  );
}
