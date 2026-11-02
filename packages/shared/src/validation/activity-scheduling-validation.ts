import { z } from 'zod';

import {
  CONFIRMED_LOOKUP_NAME,
  PITCHED_LOOKUP_NAME,
} from '../constants/constants';
import {
  zodConstraintIssueParams,
  zodRequiredIssueParams,
} from './zod-issue-kind';

export type ActivitySchedulingLookupResolvers = {
  dateStatusNameForId?: (id: number) => string | undefined;
  timeStatusNameForId?: (id: number) => string | undefined;
  pitchRequiredStatusNameForId?: (id: number) => string | undefined;
};

export type ActivitySchedulingFields = {
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  isAllDay?: boolean;
  dateStatusId?: number;
  timeStatusId?: number;
  pitchRequiredStatusId?: number | null;
  pitchDate?: string | null;
};

const START_DATE_REQUIRED_MESSAGE = 'Start date is required';
const END_DATE_REQUIRED_MESSAGE = 'End date is required';
const END_BEFORE_START_MESSAGE =
  'End date must be later than or equal to start date';
const DATE_CONFIRMED_REQUIRES_DATES_MESSAGE =
  'Date status Confirmed requires start and end dates';
const TIME_CONFIRMED_REQUIRES_TIMES_MESSAGE =
  'Time status Confirmed requires start and end times, or All day';
const PITCHED_REQUIRES_PITCH_DATE_MESSAGE =
  'Pitch status Pitched requires a pitch date';

function normalizeLookupName(name: string | undefined): string {
  return (name ?? '').trim().toLowerCase();
}

function isConfirmedLookupName(name: string | undefined): boolean {
  return normalizeLookupName(name) === CONFIRMED_LOOKUP_NAME;
}

function isPitchedLookupName(name: string | undefined): boolean {
  return normalizeLookupName(name) === PITCHED_LOOKUP_NAME;
}

function hasNonEmptyDate(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasNonEmptyTime(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function resolveDateStatusName(
  data: ActivitySchedulingFields,
  resolvers: ActivitySchedulingLookupResolvers | undefined
): string | undefined {
  if (data.dateStatusId == null || resolvers?.dateStatusNameForId == null) {
    return undefined;
  }
  return resolvers.dateStatusNameForId(data.dateStatusId);
}

function resolveTimeStatusName(
  data: ActivitySchedulingFields,
  resolvers: ActivitySchedulingLookupResolvers | undefined
): string | undefined {
  if (data.timeStatusId == null || resolvers?.timeStatusNameForId == null) {
    return undefined;
  }
  return resolvers.timeStatusNameForId(data.timeStatusId);
}

function resolvePitchStatusName(
  data: ActivitySchedulingFields,
  resolvers: ActivitySchedulingLookupResolvers | undefined
): string | undefined {
  if (
    data.pitchRequiredStatusId == null ||
    resolvers?.pitchRequiredStatusNameForId == null
  ) {
    return undefined;
  }
  return resolvers.pitchRequiredStatusNameForId(data.pitchRequiredStatusId);
}

function addIssue(
  ctx: z.RefinementCtx,
  path: (string | number)[],
  message: string,
  kind: 'required' | 'constraint'
): void {
  ctx.addIssue({
    code: 'custom',
    message,
    path,
    ...(kind === 'required'
      ? zodRequiredIssueParams()
      : zodConstraintIssueParams()),
  });
}

/**
 * Validates scheduling dates/times and cross-field status rules.
 * When resolvers are omitted, Confirmed/Pitched coupling is skipped (service validates with DB lookups).
 */
export function applyActivitySchedulingValidation(
  data: ActivitySchedulingFields,
  ctx: z.RefinementCtx,
  mode: 'create' | 'update' | 'clone',
  resolvers?: ActivitySchedulingLookupResolvers
): void {
  const requireBothDates =
    mode === 'create' ||
    mode === 'clone' ||
    data.startDate !== undefined ||
    data.endDate !== undefined;

  if (requireBothDates) {
    if (mode === 'update') {
      if (data.startDate === null) {
        addIssue(ctx, ['startDate'], START_DATE_REQUIRED_MESSAGE, 'required');
      }
      if (data.endDate === null) {
        addIssue(ctx, ['endDate'], END_DATE_REQUIRED_MESSAGE, 'required');
      }
    }

    if (mode === 'create' || mode === 'clone') {
      if (!hasNonEmptyDate(data.startDate)) {
        addIssue(ctx, ['startDate'], START_DATE_REQUIRED_MESSAGE, 'required');
      }
      if (!hasNonEmptyDate(data.endDate)) {
        addIssue(ctx, ['endDate'], END_DATE_REQUIRED_MESSAGE, 'required');
      }
    }

    if (
      hasNonEmptyDate(data.startDate) &&
      hasNonEmptyDate(data.endDate) &&
      String(data.endDate).slice(0, 10) < String(data.startDate).slice(0, 10)
    ) {
      addIssue(ctx, ['endDate'], END_BEFORE_START_MESSAGE, 'constraint');
    }
  }

  const dateStatusName = resolveDateStatusName(data, resolvers);
  if (
    dateStatusName != null &&
    isConfirmedLookupName(dateStatusName) &&
    (!hasNonEmptyDate(data.startDate) || !hasNonEmptyDate(data.endDate))
  ) {
    addIssue(
      ctx,
      ['dateStatusId'],
      DATE_CONFIRMED_REQUIRES_DATES_MESSAGE,
      'constraint'
    );
  }

  const timeStatusName = resolveTimeStatusName(data, resolvers);
  if (timeStatusName != null && isConfirmedLookupName(timeStatusName)) {
    const allDay = data.isAllDay === true;
    const hasTimes =
      allDay ||
      (hasNonEmptyTime(data.startTime) && hasNonEmptyTime(data.endTime));
    if (!hasTimes) {
      addIssue(
        ctx,
        ['timeStatusId'],
        TIME_CONFIRMED_REQUIRES_TIMES_MESSAGE,
        'constraint'
      );
    }
  }

  const pitchStatusName = resolvePitchStatusName(data, resolvers);
  if (
    pitchStatusName != null &&
    isPitchedLookupName(pitchStatusName) &&
    !hasNonEmptyDate(data.pitchDate)
  ) {
    addIssue(
      ctx,
      ['pitchDate'],
      PITCHED_REQUIRES_PITCH_DATE_MESSAGE,
      'constraint'
    );
  }
}

export function activitySchedulingSuperRefine(
  mode: 'create' | 'update' | 'clone',
  resolvers?: ActivitySchedulingLookupResolvers
) {
  return (data: ActivitySchedulingFields, ctx: z.RefinementCtx) => {
    applyActivitySchedulingValidation(data, ctx, mode, resolvers);
  };
}

export type ActivitySchedulingValidationError = {
  path: (string | number)[];
  message: string;
};

/**
 * Non-Zod validation for calendar-service (after resolving lookup names from the DB).
 */
export function collectActivitySchedulingValidationErrors(
  data: ActivitySchedulingFields,
  mode: 'create' | 'update' | 'clone',
  resolvers: ActivitySchedulingLookupResolvers
): ActivitySchedulingValidationError[] {
  const schema = z
    .object({})
    .passthrough()
    .superRefine((val, ctx) => {
      applyActivitySchedulingValidation(val, ctx, mode, resolvers);
    });
  const result = schema.safeParse(data);
  if (result.success) {
    return [];
  }
  return result.error.issues.map((issue) => ({
    path: issue.path.filter(
      (segment): segment is string | number => typeof segment !== 'symbol'
    ),
    message: issue.message,
  }));
}
