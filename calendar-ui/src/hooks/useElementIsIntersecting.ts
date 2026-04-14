import { useEffect, useState } from 'react';

/**
 * Tracks whether `element` intersects the viewport (optionally inset via `rootMargin`).
 * When `enabled` is false or `element` is null, returns `true` (assume visible; no compact UI).
 * If `IntersectionObserver` is unavailable, returns `true`.
 *
 * `rootMargin` must use pixels or percent only (`rem`/`em` throw in the browser).
 */
export function useElementIsIntersecting(
  element: Element | null,
  enabled: boolean,
  rootMargin = '0px',
  threshold = 0
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(true);

  useEffect(() => {
    if (!enabled || element == null) {
      setIsIntersecting(true);
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [element, enabled, rootMargin, threshold]);

  return isIntersecting;
}
