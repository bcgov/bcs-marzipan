/**
 * 12-hour clock parts for UI; canonical form values remain `HH:mm` (24h).
 */
export type TwelveHourParts = {
  hour12: number;
  minute: number;
  isPm: boolean;
};

/**
 * Parse `HH:mm` or `HH:mm:ss` into 12h parts. Invalid input yields null.
 */
export function hhmmToTwelveHourParts(
  hhmm: string | undefined | null
): TwelveHourParts | null {
  if (hhmm == null || typeof hhmm !== 'string') return null;
  const trimmed = hhmm.trim();
  if (!trimmed) return null;
  const [hPart, mPart] = trimmed.split(':');
  const h = parseInt(hPart ?? '', 10);
  const mRaw = (mPart ?? '0').replace(/\D/g, '').slice(0, 2);
  const m = parseInt(mRaw || '0', 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const hour24 = Math.min(23, Math.max(0, h));
  const minute = Math.min(59, Math.max(0, m));
  const isPm = hour24 >= 12;
  const hour12 = hour24 % 12 || 12;
  return { hour12, minute, isPm };
}

/**
 * Convert 12h parts to `HH:mm` for the API / Zod `z.string().time()`.
 */
export function twelveHourPartsToHHmm(parts: TwelveHourParts): string {
  let hour24: number;
  if (!parts.isPm) {
    hour24 = parts.hour12 === 12 ? 0 : parts.hour12;
  } else {
    hour24 = parts.hour12 === 12 ? 12 : parts.hour12 + 12;
  }
  return `${String(hour24).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

/** Minute values for the scroll picker (0–59). */
export const MINUTE_OPTIONS: readonly number[] = Array.from(
  { length: 60 },
  (_, i) => i
);

export const HOUR12_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** Clamp typed hour segment to 1–12. */
export function clampHour12(n: number): number {
  if (!Number.isFinite(n)) return 12;
  return Math.min(12, Math.max(1, Math.round(n)));
}

/** Clamp typed minute segment to 0–59. */
export function clampMinute(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(59, Math.max(0, Math.round(n)));
}

/**
 * 12h parts for highlighting the scroll picker while typing (before blur).
 * Uses draft segments when set; falls back to committed `value` for empty segments.
 */
export function derivePickerPreviewParts(input: {
  value: string;
  hourDraft: string;
  minDraft: string;
  isPm: boolean;
}): TwelveHourParts | null {
  const committed = hhmmToTwelveHourParts(input.value);
  const hTrim = input.hourDraft.trim();
  const mTrim = input.minDraft.trim();
  const hasAnyDraft = hTrim !== '' || mTrim !== '';

  if (!committed && !hasAnyDraft) {
    return null;
  }

  const hour12 =
    hTrim !== ''
      ? clampHour12(parseInt(hTrim, 10) || 12)
      : committed != null
        ? committed.hour12
        : 12;

  let minute: number;
  if (mTrim !== '') {
    minute = clampMinute(parseInt(mTrim, 10) || 0);
  } else {
    minute = committed != null ? committed.minute : 0;
  }

  return {
    hour12,
    minute,
    isPm: input.isPm,
  };
}
