/**
 * Admin preference for lookup custom-order editing: drag handle vs step buttons.
 * Stored in localStorage so the choice persists across sessions.
 */

export const LOOKUP_REORDER_UI_STORAGE_KEY = 'lookupReorderInteraction';

export type LookupReorderInteraction = 'drag' | 'step';

export const DEFAULT_LOOKUP_REORDER_INTERACTION: LookupReorderInteraction =
  'step';

function isLookupReorderInteraction(
  value: unknown
): value is LookupReorderInteraction {
  return value === 'drag' || value === 'step';
}

export function readLookupReorderInteraction(): LookupReorderInteraction {
  if (typeof window === 'undefined') {
    return DEFAULT_LOOKUP_REORDER_INTERACTION;
  }
  try {
    const stored = window.localStorage.getItem(LOOKUP_REORDER_UI_STORAGE_KEY);
    return isLookupReorderInteraction(stored)
      ? stored
      : DEFAULT_LOOKUP_REORDER_INTERACTION;
  } catch {
    return DEFAULT_LOOKUP_REORDER_INTERACTION;
  }
}

export function writeLookupReorderInteraction(
  mode: LookupReorderInteraction
): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(LOOKUP_REORDER_UI_STORAGE_KEY, mode);
  } catch {
    // ignore quota / private mode
  }
}
