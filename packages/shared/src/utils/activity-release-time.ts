import type { CommsMaterialReleaseFlagsById } from './comms-material-form-rules';

/** Maximum release offset: 7 days after schedule anchor. */
export const RELEASE_TIME_OFFSET_MAX_MINUTES = 7 * 24 * 60;

export const RELEASE_TIME_PRESET_OFFSETS = [0, 15, 30] as const;

export type ReleaseTimePresetOffset =
  (typeof RELEASE_TIME_PRESET_OFFSETS)[number];

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
  const startDate = input.startDate!.trim().slice(0, 10);
  const wallTime = input.isAllDay
    ? '00:00:00'
    : normalizeWallTime(input.startTime!);

  const anchorIso = `${startDate}T${wallTime}${ACTIVITY_WALL_TIME_UTC_OFFSET}`;
  const anchorMs = Date.parse(anchorIso);
  if (Number.isNaN(anchorMs)) {
    return null;
  }

  return new Date(anchorMs + offset * 60_000).toISOString();
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
