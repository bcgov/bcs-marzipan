import type { CustomReportFieldConfig } from '@corpcal/shared/reports/customReportFieldConfig';
import { cloneDefaultCustomReportFields } from '@/lib/custom-report-field-state';

/** localStorage key for persisted Custom Report field config. */
export const CUSTOM_REPORT_CONFIG_STORAGE_KEY = 'customReportConfig';

function isValidFieldOverlay(
  value: unknown
): value is Partial<CustomReportFieldConfig> & { key: string } {
  if (value === null || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return typeof o.key === 'string' && o.key.length > 0;
}

/**
 * Merge parsed saved rows onto the current default field list (by `key`).
 * Survives app updates that add/remove fields: unknown keys are ignored; new defaults get defaults.
 */
function mergeSavedWithDefaults(parsed: unknown): CustomReportFieldConfig[] {
  const defaults = cloneDefaultCustomReportFields();
  if (!Array.isArray(parsed)) {
    return defaults;
  }

  const overlay = new Map<string, Partial<CustomReportFieldConfig>>();
  for (const item of parsed) {
    if (!isValidFieldOverlay(item)) continue;
    overlay.set(item.key, item);
  }

  return defaults.map((d) => {
    const s = overlay.get(d.key);
    if (!s) return d;
    const width =
      typeof s.width === 'number' &&
      Number.isFinite(s.width) &&
      s.width >= 40 &&
      s.width <= 2000
        ? s.width
        : d.width;
    return {
      key: d.key,
      label: typeof s.label === 'string' ? s.label : d.label,
      selected: typeof s.selected === 'boolean' ? s.selected : d.selected,
      section: typeof s.section === 'string' ? s.section : d.section,
      order:
        typeof s.order === 'number' && Number.isFinite(s.order)
          ? s.order
          : d.order,
      ...(width !== undefined ? { width } : {}),
    };
  });
}

/**
 * Load Custom Report config from storage, or defaults if missing/invalid.
 * Safe if JSON shape changes between app versions.
 */
export function loadCustomReportConfig(): CustomReportFieldConfig[] {
  if (typeof window === 'undefined') {
    return cloneDefaultCustomReportFields();
  }
  try {
    const raw = window.localStorage.getItem(CUSTOM_REPORT_CONFIG_STORAGE_KEY);
    if (raw == null || raw === '') {
      return cloneDefaultCustomReportFields();
    }
    const parsed: unknown = JSON.parse(raw);
    return mergeSavedWithDefaults(parsed);
  } catch {
    return cloneDefaultCustomReportFields();
  }
}

/**
 * Persist config. When a user-scoped API is added, call it from here and fall back to localStorage on failure.
 */
export function saveCustomReportConfig(
  fields: CustomReportFieldConfig[]
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      CUSTOM_REPORT_CONFIG_STORAGE_KEY,
      JSON.stringify(fields)
    );
  } catch {
    // Quota or private mode — ignore
  }
}
