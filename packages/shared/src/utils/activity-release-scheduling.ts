import type { z } from 'zod';

import type { ReleaseSchedulingMode } from '../constants/constants';
import { zodConstraintIssueParams } from '../validation/zod-issue-kind';
import {
  computeActivityReleaseTimeInstant,
  RELEASE_TIME_PRESET_OFFSETS,
  type ActivityReleaseTimeScheduleInput,
} from './activity-release-time';

export function parseReleaseSchedulingMode(
  value: string | null | undefined
): ReleaseSchedulingMode | null {
  if (value === 'relative' || value === 'on_signal') {
    return value;
  }
  return null;
}

export const RELEASE_SCHEDULING_RADIO_NOT_SPECIFIED = 'not_specified';
export const RELEASE_SCHEDULING_RADIO_ON_SIGNAL = 'on_signal';
export const RELEASE_SCHEDULING_RADIO_CUSTOM = 'custom';

export type ReleaseSchedulingRadioValue =
  | typeof RELEASE_SCHEDULING_RADIO_NOT_SPECIFIED
  | typeof RELEASE_SCHEDULING_RADIO_ON_SIGNAL
  | typeof RELEASE_SCHEDULING_RADIO_CUSTOM
  | `${number}`;

export function isReleaseSchedulingPresetOffset(
  minutes: number
): minutes is (typeof RELEASE_TIME_PRESET_OFFSETS)[number] {
  return (RELEASE_TIME_PRESET_OFFSETS as readonly number[]).includes(minutes);
}

export function releaseSchedulingRadioValueFromFields(
  mode: ReleaseSchedulingMode | null | undefined,
  offsetMinutes: number | null | undefined
): ReleaseSchedulingRadioValue {
  if (mode === 'on_signal') {
    return RELEASE_SCHEDULING_RADIO_ON_SIGNAL;
  }
  if (mode === 'relative' || offsetMinutes != null) {
    if (offsetMinutes === null || offsetMinutes === undefined) {
      if (mode === 'relative') {
        return RELEASE_SCHEDULING_RADIO_CUSTOM;
      }
      return RELEASE_SCHEDULING_RADIO_NOT_SPECIFIED;
    }
    if (isReleaseSchedulingPresetOffset(offsetMinutes)) {
      return String(offsetMinutes) as ReleaseSchedulingRadioValue;
    }
    return RELEASE_SCHEDULING_RADIO_CUSTOM;
  }
  return RELEASE_SCHEDULING_RADIO_NOT_SPECIFIED;
}

export type ReleaseSchedulingFieldsUpdate = {
  releaseSchedulingMode: ReleaseSchedulingMode | null;
  releaseTimeOffsetMinutes: number | null;
};

export function applyReleaseSchedulingRadioChange(
  radioValue: string
): ReleaseSchedulingFieldsUpdate {
  if (radioValue === RELEASE_SCHEDULING_RADIO_NOT_SPECIFIED) {
    return {
      releaseSchedulingMode: null,
      releaseTimeOffsetMinutes: null,
    };
  }
  if (radioValue === RELEASE_SCHEDULING_RADIO_ON_SIGNAL) {
    return {
      releaseSchedulingMode: 'on_signal',
      releaseTimeOffsetMinutes: null,
    };
  }
  if (radioValue === RELEASE_SCHEDULING_RADIO_CUSTOM) {
    return {
      releaseSchedulingMode: 'relative',
      releaseTimeOffsetMinutes: null,
    };
  }
  const parsed = Number(radioValue);
  if (Number.isInteger(parsed) && parsed >= 0) {
    return {
      releaseSchedulingMode: 'relative',
      releaseTimeOffsetMinutes: parsed,
    };
  }
  return {
    releaseSchedulingMode: null,
    releaseTimeOffsetMinutes: null,
  };
}

export function formatReleaseSchedulingModeLabel(
  mode: ReleaseSchedulingMode | null | undefined
): string {
  if (mode === 'relative') {
    return 'Relative to scheduled start';
  }
  if (mode === 'on_signal') {
    return 'On signal';
  }
  return '(empty)';
}

export type NormalizeReleaseSchedulingPersistenceInput =
  ActivityReleaseTimeScheduleInput & {
    releaseSchedulingMode?: ReleaseSchedulingMode | null;
  };

export type NormalizeReleaseSchedulingPersistenceResult = {
  releaseSchedulingMode: ReleaseSchedulingMode | null;
  releaseTimeOffsetMinutes: number | null;
  releaseTime: string | null;
};

/**
 * Applies release scheduling invariants and computes derived release instant for relative mode.
 */
export function normalizeReleaseSchedulingPersistence(
  input: NormalizeReleaseSchedulingPersistenceInput
): NormalizeReleaseSchedulingPersistenceResult {
  let mode = input.releaseSchedulingMode ?? null;
  const offset = input.releaseTimeOffsetMinutes ?? null;

  if (mode === 'on_signal') {
    return {
      releaseSchedulingMode: 'on_signal',
      releaseTimeOffsetMinutes: null,
      releaseTime: null,
    };
  }

  if (offset != null && mode === null) {
    mode = 'relative';
  }

  if (mode !== 'relative') {
    return {
      releaseSchedulingMode: mode,
      releaseTimeOffsetMinutes: offset,
      releaseTime: null,
    };
  }

  const instantIso = computeActivityReleaseTimeInstant({
    releaseTimeOffsetMinutes: offset,
    startDate: input.startDate,
    startTime: input.startTime,
    isAllDay: input.isAllDay,
    dateStatusName: input.dateStatusName,
    timeStatusName: input.timeStatusName,
  });

  return {
    releaseSchedulingMode: 'relative',
    releaseTimeOffsetMinutes: offset,
    releaseTime: instantIso,
  };
}

export function releaseSchedulingSuperRefine(
  data: {
    releaseSchedulingMode?: ReleaseSchedulingMode | null;
    releaseTimeOffsetMinutes?: number | null;
  },
  ctx: z.RefinementCtx
): void {
  if (data.releaseSchedulingMode === 'on_signal') {
    if (
      data.releaseTimeOffsetMinutes !== null &&
      data.releaseTimeOffsetMinutes !== undefined
    ) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Release time offset must be empty when scheduling mode is on signal.',
        path: ['releaseTimeOffsetMinutes'],
        ...zodConstraintIssueParams(),
      });
    }
  }
}
