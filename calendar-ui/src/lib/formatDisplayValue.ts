import { createLogger } from './logger';

const logger = createLogger('formatDisplayValue');

/** Neutral string shown when a lookup/relation value cannot be formatted (e.g. circular ref). */
const FALLBACK_DISPLAY = '';

/**
 * Returns a display string for a value that may be a primitive or a lookup-style
 * object (with name, label, or displayName). Use for activity status, date/time
 * status, categories, and other relation/lookup displays.
 *
 * - null/undefined -> ''
 * - string/number -> stringified
 * - object with name/label/displayName -> first available
 * - other object -> JSON.stringify, or FALLBACK_DISPLAY if that throws (logs warning)
 */
export function formatDisplayValue(value: unknown): string {
  if (value == null) return FALLBACK_DISPLAY;
  if (typeof value === 'string' || typeof value === 'number')
    return String(value);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.name === 'string') return obj.name;
    if (typeof obj.label === 'string') return obj.label;
    if (typeof obj.displayName === 'string') return obj.displayName;
    try {
      return JSON.stringify(obj);
    } catch {
      logger.warn(
        'formatDisplayValue: could not stringify value (e.g. circular ref), using fallback',
        value
      );
      return FALLBACK_DISPLAY;
    }
  }
  return String(JSON.stringify(value));
}
