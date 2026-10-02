import type { Activity } from '@corpcal/database/types';
import {
  resolveBumpPublicLastUpdated,
  type ResolveBumpPublicLastUpdatedError,
  type TimestampWriteContext,
} from '@corpcal/shared';

type ActivityOperationalTimestamp = Pick<
  Activity,
  'lastUpdatedBy' | 'lastUpdatedDateTime'
>;

type ActivityPublicTimestamp = Pick<
  Activity,
  'publicLastUpdatedBy' | 'publicLastUpdatedDateTime'
>;

export type ActivityTimestampWriteInput = {
  context: TimestampWriteContext;
  userId: number;
  now: Date;
  permissions?: string[];
  renewPublicLastUpdated?: boolean;
};

/** Contexts that always bump public last-updated (see resolveBumpPublicLastUpdated). */
export type LifecycleTimestampWriteContext =
  | 'create'
  | 'softDelete'
  | 'restore'
  | 'deleteRequested';

export type ActivityTimestampPolicyErrorCode = 'forbidden' | 'bad_request';

/** Thrown when timestamp write policy rejects the request (map to HTTP in controllers/services). */
export class ActivityTimestampPolicyError extends Error {
  readonly code: ActivityTimestampPolicyErrorCode;

  constructor(code: ActivityTimestampPolicyErrorCode, message: string) {
    super(message);
    this.name = 'ActivityTimestampPolicyError';
    this.code = code;
  }

  static fromResolveFailure(
    failure: ResolveBumpPublicLastUpdatedError
  ): ActivityTimestampPolicyError {
    return new ActivityTimestampPolicyError(failure.code, failure.message);
  }
}

/** Resolves whether public last-updated should bump for this write context. */
export function resolveActivityTimestampBumpPublic(
  input: ActivityTimestampWriteInput
): boolean {
  const result = resolveBumpPublicLastUpdated({
    context: input.context,
    permissions: input.permissions ?? [],
    renewPublicLastUpdated: input.renewPublicLastUpdated,
  });
  if (!result.ok) {
    throw ActivityTimestampPolicyError.fromResolveFailure(result);
  }
  return result.bumpPublic;
}

/**
 * Operational + conditional public last-updated columns for an activity save.
 * Prefer {@link getActivityTimestampUpdateForWrite} at call sites so bump rules stay centralized.
 */
export function buildActivityTimestampUpdate(
  bumpPublic: true,
  userId: number,
  now: Date
): ActivityOperationalTimestamp & ActivityPublicTimestamp;
export function buildActivityTimestampUpdate(
  bumpPublic: false,
  userId: number,
  now: Date
): ActivityOperationalTimestamp;
export function buildActivityTimestampUpdate(
  bumpPublic: boolean,
  userId: number,
  now: Date
): ActivityOperationalTimestamp & Partial<ActivityPublicTimestamp>;
export function buildActivityTimestampUpdate(
  bumpPublic: boolean,
  userId: number,
  now: Date
): ActivityOperationalTimestamp & Partial<ActivityPublicTimestamp> {
  const operational = {
    lastUpdatedBy: userId,
    lastUpdatedDateTime: now,
  };
  if (bumpPublic) {
    return {
      ...operational,
      publicLastUpdatedBy: userId,
      publicLastUpdatedDateTime: now,
    };
  }
  return operational;
}

/** Resolves bump policy and returns activity timestamp columns for INSERT/UPDATE. */
export function getActivityTimestampUpdateForWrite(
  input: ActivityTimestampWriteInput & {
    context: LifecycleTimestampWriteContext;
  }
): ActivityOperationalTimestamp & ActivityPublicTimestamp;
export function getActivityTimestampUpdateForWrite(
  input: ActivityTimestampWriteInput
): ActivityOperationalTimestamp & Partial<ActivityPublicTimestamp>;
export function getActivityTimestampUpdateForWrite(
  input: ActivityTimestampWriteInput
): ActivityOperationalTimestamp & Partial<ActivityPublicTimestamp> {
  const bumpPublic = resolveActivityTimestampBumpPublic(input);
  return buildActivityTimestampUpdate(bumpPublic, input.userId, input.now);
}
