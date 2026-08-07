import type { KeyboardEvent, MouseEvent } from 'react';

/** Clicks/focus inside these elements must not trigger row-level navigation. */
export const TABLE_ROW_NO_NAV_SELECTOR = 'a,button,[data-no-row-nav]';

export function isTableRowNavIgnoredTarget(
  target: EventTarget | null
): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest(TABLE_ROW_NO_NAV_SELECTOR))
  );
}

export function hasNonEmptyTextSelection(): boolean {
  return Boolean(window.getSelection()?.toString().trim());
}

export function handleTableRowClick(
  event: MouseEvent,
  onNavigate: () => void
): void {
  if (isTableRowNavIgnoredTarget(event.target)) return;
  if (hasNonEmptyTextSelection()) return;
  onNavigate();
}

export function handleTableRowKeyDown(
  event: KeyboardEvent,
  onNavigate: () => void
): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  if (isTableRowNavIgnoredTarget(event.target)) return;
  event.preventDefault();
  onNavigate();
}
