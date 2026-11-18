import { useEffect, useRef, useState } from 'react';

const DEFAULT_THRESHOLD_PX = 12;
const MIN_SCROLL_Y_TO_HIDE = 48;

/**
 * Hides chrome while scrolling down; shows again on scroll up or near page top.
 */
export function useAutoHideHeader(thresholdPx = DEFAULT_THRESHOLD_PX): boolean {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onScroll = () => {
      const y = window.scrollY;
      if (y <= MIN_SCROLL_Y_TO_HIDE) {
        setVisible(true);
        lastScrollY.current = y;
        return;
      }
      const delta = y - lastScrollY.current;
      if (Math.abs(delta) < thresholdPx) return;
      if (prefersReducedMotion) {
        setVisible(delta < 0);
      } else {
        setVisible(delta < 0);
      }
      lastScrollY.current = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [thresholdPx]);

  return visible;
}
