import { useEffect, useRef, useState, type RefObject } from 'react';

export interface UseElementWidthOptions {
  /** Min change in px before updating. Only emit when |newWidth - prevWidth| >= minChange or prevWidth === 0. */
  minChange?: number;
  /** Debounce ResizeObserver callbacks (ms) to avoid rapid updates during resize. */
  debounceMs?: number;
}

/**
 * Returns the client width of the element attached to `ref`, updating on resize.
 * Optional threshold and debounce reduce churn when used for layout measurement.
 */
export function useElementWidth(
  ref: RefObject<HTMLElement | null>,
  options?: UseElementWidthOptions
): number {
  const [width, setWidth] = useState(0);
  const prevWidthRef = useRef(0);
  const { minChange = 0, debounceMs = 0 } = options ?? {};

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const applyWidth = (value: number) => {
      const prev = prevWidthRef.current;
      const pastThreshold =
        minChange <= 0 || Math.abs(value - prev) >= minChange || prev === 0;
      if (pastThreshold) {
        prevWidthRef.current = value;
        setWidth(value);
      }
    };

    applyWidth(node.clientWidth);

    if (typeof ResizeObserver === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const onResize = () => {
      const current = ref.current;
      if (!current) return;

      if (debounceMs > 0) {
        if (timeoutId !== null) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          timeoutId = null;
          const el = ref.current;
          if (el) applyWidth(el.clientWidth);
        }, debounceMs);
      } else {
        applyWidth(current.clientWidth);
      }
    };

    const observer = new ResizeObserver(onResize);
    observer.observe(node);

    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [minChange, debounceMs]);

  return width;
}
