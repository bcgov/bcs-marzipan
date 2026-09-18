/**
 * Session-scoped preferences for Grid A column order and widths.
 *
 * Stored in sessionStorage so column arrangement resets when the tab closes.
 */

export const ACTIVITY_GRID_STORAGE_KEY = 'activityTableGridPreferences';

export interface ActivityGridLayoutPreferences {
  columnOrder: string[];
  columnSizing: Record<string, number>;
}

export const DEFAULT_ACTIVITY_GRID_LAYOUT_PREFERENCES: ActivityGridLayoutPreferences =
  {
    columnOrder: [],
    columnSizing: {},
  };

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function parseSizingRecord(value: unknown): Record<string, number> {
  if (value == null || typeof value !== 'object') return {};
  const result: Record<string, number> = {};
  for (const [key, size] of Object.entries(value as Record<string, unknown>)) {
    if (typeof size === 'number' && Number.isFinite(size) && size > 0) {
      result[key] = size;
    }
  }
  return result;
}

function isLegacyPreferences(
  value: Record<string, unknown>
): value is Record<string, unknown> & { variant: unknown } {
  return 'variant' in value;
}

/** Coerce arbitrary parsed JSON into valid preferences, dropping unknown data. */
export function normalizeActivityGridLayoutPreferences(
  value: unknown
): ActivityGridLayoutPreferences {
  if (value == null || typeof value !== 'object') {
    return DEFAULT_ACTIVITY_GRID_LAYOUT_PREFERENCES;
  }

  const raw = value as Record<string, unknown>;

  if (!isLegacyPreferences(raw)) {
    return {
      columnOrder: parseStringArray(raw.columnOrder),
      columnSizing: parseSizingRecord(raw.columnSizing),
    };
  }

  const columnOrder = (raw.columnOrder ?? {}) as Record<string, unknown>;
  const columnSizing = (raw.columnSizing ?? {}) as Record<string, unknown>;

  return {
    columnOrder: parseStringArray(columnOrder.A),
    columnSizing: parseSizingRecord(columnSizing.A),
  };
}

export function readActivityGridLayoutPreferences(): ActivityGridLayoutPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_ACTIVITY_GRID_LAYOUT_PREFERENCES;
  }
  try {
    const stored = window.sessionStorage.getItem(ACTIVITY_GRID_STORAGE_KEY);
    if (!stored) return DEFAULT_ACTIVITY_GRID_LAYOUT_PREFERENCES;
    return normalizeActivityGridLayoutPreferences(JSON.parse(stored));
  } catch {
    return DEFAULT_ACTIVITY_GRID_LAYOUT_PREFERENCES;
  }
}

export function writeActivityGridLayoutPreferences(
  preferences: ActivityGridLayoutPreferences
): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      ACTIVITY_GRID_STORAGE_KEY,
      JSON.stringify(preferences)
    );
  } catch {
    // Storage unavailable (private mode, quota); the layout simply will not persist.
  }
}

/**
 * Reconcile a persisted column order against the columns a grid actually has:
 * unknown ids are dropped and newly added columns are appended in their
 * default position so a stale session never hides a column.
 */
export function reconcileColumnOrder(
  storedOrder: string[],
  defaultOrder: string[]
): string[] {
  const known = new Set(defaultOrder);
  const kept = storedOrder.filter(
    (id, index) => known.has(id) && storedOrder.indexOf(id) === index
  );
  const keptSet = new Set(kept);
  const missing = defaultOrder.filter((id) => !keptSet.has(id));
  if (missing.length === 0) return kept;

  // Re-insert missing columns at their default index so ordering stays stable.
  const result = [...kept];
  for (const id of missing) {
    const defaultIndex = defaultOrder.indexOf(id);
    const insertAt = Math.min(defaultIndex, result.length);
    result.splice(insertAt, 0, id);
  }
  return result;
}
