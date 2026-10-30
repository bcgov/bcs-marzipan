import {
  formatCivilPacificReleasePreview,
  formatInstantPacificReleasePreview,
  formatTimeTbdPacificReleasePreview,
} from '../datetime/format';
import type { CommsMaterialReleaseFlagsById } from './comms-material-form-rules';

/** Date suffix when schedule start date is not set (release preview copy). */
export const RELEASE_TIME_PREVIEW_DATE_TBD = 'Date TBD';

/** Time prefix when schedule start time is not set (release preview copy). */
export const RELEASE_TIME_PREVIEW_TIME_TBD = 'Time TBD';

/** Maximum release offset: 7 days after schedule anchor. */
export const RELEASE_TIME_OFFSET_MAX_MINUTES = 7 * 24 * 60;

export const RELEASE_TIME_PRESET_OFFSETS = [0, 15, 30] as const;

export type ReleaseTimePresetOffset =
  (typeof RELEASE_TIME_PRESET_OFFSETS)[number];

export const RELEASE_TIME_OFFSET_CUSTOM_UNITS = [
  'minutes',
  'hours',
  'days',
] as const;

export type ReleaseTimeOffsetCustomUnit =
  (typeof RELEASE_TIME_OFFSET_CUSTOM_UNITS)[number];

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

/** Max whole amount per unit (maps to {@link RELEASE_TIME_OFFSET_MAX_MINUTES}). */
export const RELEASE_TIME_OFFSET_MAX_AMOUNT_BY_UNIT: Record<
  ReleaseTimeOffsetCustomUnit,
  number
> = {
  minutes: RELEASE_TIME_OFFSET_MAX_MINUTES,
  hours: RELEASE_TIME_OFFSET_MAX_MINUTES / MINUTES_PER_HOUR,
  days: RELEASE_TIME_OFFSET_MAX_MINUTES / MINUTES_PER_DAY,
};

function releaseTimeOffsetUnitToMinutes(
  unit: ReleaseTimeOffsetCustomUnit
): number {
  switch (unit) {
    case 'minutes':
      return 1;
    case 'hours':
      return MINUTES_PER_HOUR;
    case 'days':
      return MINUTES_PER_DAY;
  }
}

export type ReleaseTimeOffsetCustomParts = {
  amount: number;
  unit: ReleaseTimeOffsetCustomUnit;
};

/** Prefer days, then hours, then minutes for display/editing custom offsets. */
export function releaseTimeOffsetMinutesToCustomParts(
  minutes: number
): ReleaseTimeOffsetCustomParts {
  if (minutes > 0 && minutes % MINUTES_PER_DAY === 0) {
    return { amount: minutes / MINUTES_PER_DAY, unit: 'days' };
  }
  if (minutes > 0 && minutes % MINUTES_PER_HOUR === 0) {
    return { amount: minutes / MINUTES_PER_HOUR, unit: 'hours' };
  }
  return { amount: minutes, unit: 'minutes' };
}

export function customPartsToReleaseTimeOffsetMinutes(
  amount: number,
  unit: ReleaseTimeOffsetCustomUnit
): number | null {
  if (!Number.isInteger(amount) || amount < 0) {
    return null;
  }
  const minutes = amount * releaseTimeOffsetUnitToMinutes(unit);
  if (minutes > RELEASE_TIME_OFFSET_MAX_MINUTES) {
    return null;
  }
  return minutes;
}

export function isValidCustomReleaseTimeOffsetAmount(
  amount: number,
  unit: ReleaseTimeOffsetCustomUnit
): boolean {
  return customPartsToReleaseTimeOffsetMinutes(amount, unit) !== null;
}

export function getReleaseTimeOffsetMaxAmountForUnit(
  unit: ReleaseTimeOffsetCustomUnit
): number {
  return RELEASE_TIME_OFFSET_MAX_AMOUNT_BY_UNIT[unit];
}

/**
 * Express an offset in a chosen unit, rounding to the nearest whole amount.
 * If rounding would yield 0 for a non-zero offset, keeps minutes instead.
 */
export function releaseTimeOffsetMinutesToCustomPartsForUnit(
  offsetMinutes: number,
  targetUnit: ReleaseTimeOffsetCustomUnit
): ReleaseTimeOffsetCustomParts {
  if (!Number.isInteger(offsetMinutes) || offsetMinutes < 0) {
    return { amount: 0, unit: 'minutes' };
  }
  if (targetUnit === 'minutes') {
    return { amount: offsetMinutes, unit: 'minutes' };
  }

  const unitMinutes = releaseTimeOffsetUnitToMinutes(targetUnit);
  let amount = Math.round(offsetMinutes / unitMinutes);

  if (amount === 0 && offsetMinutes > 0) {
    return releaseTimeOffsetMinutesToCustomParts(offsetMinutes);
  }

  const maxAmount = RELEASE_TIME_OFFSET_MAX_AMOUNT_BY_UNIT[targetUnit];
  if (amount > maxAmount) {
    amount = maxAmount;
  }

  return { amount, unit: targetUnit };
}

/** Fixed offset appended to activity wall date/time (see activity-completion job). */
export const ACTIVITY_WALL_TIME_UTC_OFFSET = '-07:00';

export type ActivityReleaseTimeScheduleInput = {
  releaseTimeOffsetMinutes: number | null | undefined;
  startDate: string | null | undefined;
  startTime: string | null | undefined;
  isAllDay: boolean;
  dateStatusName: string | null | undefined;
  timeStatusName: string | null | undefined;
};

function normalizeWallTime(value: string): string {
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }
  return trimmed;
}

export type ActivityReleaseTimePreviewInput = {
  releaseTimeOffsetMinutes: number | null | undefined;
  startDate: string | null | undefined;
  startTime: string | null | undefined;
  isAllDay: boolean;
};

export type ActivityReleaseTimePreviewResult =
  | { kind: 'preview'; label: string }
  | { kind: 'hint'; message: string };

function addMinutesToCivilWallTime(
  wallTime: string,
  offsetMinutes: number
): string {
  const normalized = normalizeWallTime(wallTime.trim());
  const [hRaw, mRaw] = normalized.split(':');
  const hour = Number.parseInt(hRaw ?? '0', 10);
  const minute = Number.parseInt(mRaw ?? '0', 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return normalized;
  }
  let total = hour * 60 + minute + offsetMinutes;
  total = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hOut = Math.floor(total / 60);
  const mOut = total % 60;
  return `${hOut}:${String(mOut).padStart(2, '0')}`;
}

function addOffsetToScheduleAnchor(
  startDate: string,
  startTime: string | null | undefined,
  isAllDay: boolean,
  offsetMinutes: number
): string | null {
  const datePart = startDate.trim().slice(0, 10);
  const wallTime = isAllDay ? '00:00:00' : normalizeWallTime(startTime!.trim());

  const anchorIso = `${datePart}T${wallTime}${ACTIVITY_WALL_TIME_UTC_OFFSET}`;
  const anchorMs = Date.parse(anchorIso);
  if (Number.isNaN(anchorMs)) {
    return null;
  }

  return new Date(anchorMs + offsetMinutes * 60_000).toISOString();
}

/**
 * Presentational release instant for the activity form (ignores confirmed status).
 * Returns null when offset is unset (no helper line).
 */
export function getActivityReleaseTimePreview(
  input: ActivityReleaseTimePreviewInput
): ActivityReleaseTimePreviewResult | null {
  const offset = input.releaseTimeOffsetMinutes;
  if (offset === null || offset === undefined) {
    return null;
  }

  const startDate = input.startDate?.trim();
  const startTime = input.startTime?.trim();

  if (!startDate) {
    if (!input.isAllDay && startTime) {
      const civil = addMinutesToCivilWallTime(startTime, offset);
      const label = formatCivilPacificReleasePreview(
        civil,
        RELEASE_TIME_PREVIEW_DATE_TBD
      );
      if (label) {
        return { kind: 'preview', label };
      }
    }
    return { kind: 'hint', message: 'Start date required' };
  }

  if (!input.isAllDay && !startTime) {
    const dateOnlyInstant = addOffsetToScheduleAnchor(
      startDate,
      null,
      true,
      offset
    );
    const label = dateOnlyInstant
      ? formatTimeTbdPacificReleasePreview(dateOnlyInstant)
      : '';
    if (label) {
      return { kind: 'preview', label };
    }
    return { kind: 'hint', message: 'Start time required' };
  }

  const instantIso = addOffsetToScheduleAnchor(
    startDate,
    input.startTime,
    input.isAllDay,
    offset
  );
  if (!instantIso) {
    return { kind: 'hint', message: 'Start time required' };
  }

  const label = formatInstantPacificReleasePreview(instantIso);
  if (!label) {
    return { kind: 'hint', message: 'Start time required' };
  }

  return { kind: 'preview', label };
}

function canComputeReleaseInstant(
  input: ActivityReleaseTimeScheduleInput
): boolean {
  const offset = input.releaseTimeOffsetMinutes;
  if (offset === null || offset === undefined) {
    return false;
  }
  const startDate = input.startDate?.trim();
  if (!startDate) {
    return false;
  }
  if (input.dateStatusName !== 'confirmed') {
    return false;
  }
  if (input.isAllDay) {
    return true;
  }
  if (input.timeStatusName !== 'confirmed') {
    return false;
  }
  const startTime = input.startTime?.trim();
  return Boolean(startTime);
}

/**
 * Computes release instant from schedule anchor + offset minutes.
 * Returns ISO 8601 string or null when gates fail.
 */
export function computeActivityReleaseTimeInstant(
  input: ActivityReleaseTimeScheduleInput
): string | null {
  if (!canComputeReleaseInstant(input)) {
    return null;
  }

  const offset = input.releaseTimeOffsetMinutes as number;
  return addOffsetToScheduleAnchor(
    input.startDate!,
    input.startTime,
    input.isAllDay,
    offset
  );
}

export function isReleaseTimeOffsetInRange(
  minutes: number | null | undefined
): boolean {
  if (minutes === null || minutes === undefined) {
    return true;
  }
  return (
    Number.isInteger(minutes) &&
    minutes >= 0 &&
    minutes <= RELEASE_TIME_OFFSET_MAX_MINUTES
  );
}

export function formatReleaseTimeOffsetLabel(
  minutes: number | null | undefined
): string {
  if (minutes === null || minutes === undefined) {
    return '(empty)';
  }
  if (minutes === 0) {
    return 'At scheduled start';
  }
  if (minutes === 15) {
    return '15 minutes after scheduled start';
  }
  if (minutes === 30) {
    return '30 minutes after scheduled start';
  }

  if (minutes % (24 * 60) === 0) {
    const days = minutes / (24 * 60);
    return days === 1
      ? '1 day after scheduled start'
      : `${days} days after scheduled start`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1
      ? '1 hour after scheduled start'
      : `${hours} hours after scheduled start`;
  }
  return `${minutes} minutes after scheduled start`;
}

export function activityNeedsReleaseTimeField(
  commsMaterialIds: number[] | undefined,
  flagsById: CommsMaterialReleaseFlagsById | undefined
): boolean {
  if (!flagsById || flagsById.size === 0) {
    return false;
  }
  const ids = commsMaterialIds ?? [];
  return ids.some((id) => flagsById.get(id)?.audience === 'public');
}
