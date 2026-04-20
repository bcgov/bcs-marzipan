import type { ActivityResponse } from '@corpcal/shared/api/types';
import type { VenueAddressBase } from '@corpcal/shared/schemas';
import { plainTextFromActivityRichField } from '@corpcal/shared/utils';
import { formatExactDate, formatTime12h } from '@/lib/datetime-utils';

const RICH_TEXT_KEYS = new Set([
  'summary',
  'executiveSummary',
  'significance',
  'notes',
]);

const DATE_KEYS = new Set(['startDate', 'endDate', 'pitchDate']);

const TIME_KEYS = new Set(['startTime', 'endTime']);

const DATETIME_KEYS = new Set(['createdDateTime', 'lastUpdatedDateTime']);

function formatVenueAddressLine(
  va: VenueAddressBase | null | undefined
): string {
  if (!va || typeof va !== 'object') return '';
  const parts = [
    va.venueName,
    va.addressLine1,
    va.addressLine2,
    va.city,
    va.provinceOrState,
    va.country,
  ].filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
  return parts.join(', ');
}

function previewStringFromArrayItem(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }
  if (typeof value === 'bigint') {
    return String(value);
  }
  return '';
}

/**
 * Single cell string for Custom Report preview / export: one value, no HTML.
 */
export function formatCustomReportCell(
  activity: ActivityResponse,
  key: string
): string {
  const raw = activity[key as keyof ActivityResponse];

  if (raw === null || raw === undefined) {
    return '';
  }

  if (RICH_TEXT_KEYS.has(key) && typeof raw === 'string') {
    return plainTextFromActivityRichField(raw);
  }

  if (DATE_KEYS.has(key) && typeof raw === 'string') {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? '' : formatExactDate(d);
  }

  if (TIME_KEYS.has(key) && (typeof raw === 'string' || raw === null)) {
    return formatTime12h(raw);
  }

  if (DATETIME_KEYS.has(key) && typeof raw === 'string') {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '';
    return formatExactDate(d, { includeTime: true });
  }

  if (key === 'tags' && Array.isArray(raw)) {
    return raw
      .map((t) =>
        t && typeof t === 'object' && 'text' in t ? String(t.text) : ''
      )
      .filter(Boolean)
      .join(', ');
  }

  if (key === 'category' && Array.isArray(raw)) {
    return raw.map(String).join(', ');
  }

  if (key === 'commsContacts' && Array.isArray(raw)) {
    return raw
      .map((c) =>
        c && typeof c === 'object' && 'name' in c ? String(c.name) : ''
      )
      .filter(Boolean)
      .join(', ');
  }

  if (key === 'commsMaterials' && Array.isArray(raw)) {
    return raw.map(String).join(', ');
  }

  if (key === 'translationsRequired' && Array.isArray(raw)) {
    return raw.map(String).join(', ');
  }

  if (key === 'representativesAttending' && Array.isArray(raw)) {
    return raw.map(String).join(', ');
  }

  if (key === 'sharedWith' && Array.isArray(raw)) {
    return raw.map(String).join(', ');
  }

  if (key === 'eventPlanners' && Array.isArray(raw)) {
    return raw.map(String).join(', ');
  }

  if (key === 'eventPlannerDetails' && Array.isArray(raw)) {
    return raw
      .map((p) =>
        p && typeof p === 'object' && 'name' in p ? String(p.name) : ''
      )
      .filter(Boolean)
      .join(', ');
  }

  if (key === 'reportSettings' && Array.isArray(raw)) {
    return raw
      .map((r) =>
        r && typeof r === 'object' && 'displayName' in r
          ? String(r.displayName)
          : ''
      )
      .filter(Boolean)
      .join(', ');
  }

  if (key === 'changedFieldsSinceReview' && Array.isArray(raw)) {
    return raw.map(String).join(', ');
  }

  if (key === 'venueAddress') {
    return formatVenueAddressLine(raw as VenueAddressBase | null);
  }

  if (typeof raw === 'boolean') {
    return raw ? 'Yes' : 'No';
  }

  if (typeof raw === 'number') {
    return String(raw);
  }

  if (Array.isArray(raw)) {
    return raw.map(previewStringFromArrayItem).filter(Boolean).join(', ');
  }

  if (typeof raw === 'object') {
    return '';
  }

  return String(raw);
}
