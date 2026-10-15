import { describe, expect, it } from 'vitest';

import { PERMISSIONS } from '@corpcal/shared';

import {
  ActivityTimestampPolicyError,
  buildActivityTimestampUpdate,
  getActivityTimestampUpdateForWrite,
  resolveActivityTimestampBumpPublic,
} from './activity-timestamp-write';

const deferPermission = [PERMISSIONS.ACTIVITIES.PUBLIC_LAST_UPDATED_DEFER];

describe('buildActivityTimestampUpdate', () => {
  const userId = 7;
  const now = new Date('2026-06-01T12:00:00.000Z');

  it('bumps operational and public when bumpPublic is true', () => {
    expect(buildActivityTimestampUpdate(true, userId, now)).toEqual({
      lastUpdatedBy: userId,
      lastUpdatedDateTime: now,
      publicLastUpdatedBy: userId,
      publicLastUpdatedDateTime: now,
    });
  });

  it('bumps only operational when bumpPublic is false', () => {
    expect(buildActivityTimestampUpdate(false, userId, now)).toEqual({
      lastUpdatedBy: userId,
      lastUpdatedDateTime: now,
    });
  });
});

describe('getActivityTimestampUpdateForWrite', () => {
  const userId = 7;
  const now = new Date('2026-06-01T12:00:00.000Z');

  it('userPatch: defer skips public unless renew', () => {
    expect(
      getActivityTimestampUpdateForWrite({
        context: 'userPatch',
        permissions: deferPermission,
        userId,
        now,
      })
    ).toEqual(buildActivityTimestampUpdate(false, userId, now));

    expect(
      getActivityTimestampUpdateForWrite({
        context: 'userPatch',
        permissions: deferPermission,
        renewPublicLastUpdated: true,
        userId,
        now,
      })
    ).toEqual(buildActivityTimestampUpdate(true, userId, now));
  });

  it('lifecycle contexts always bump public', () => {
    for (const context of [
      'create',
      'softDelete',
      'restore',
      'deleteRequested',
    ] as const) {
      expect(
        getActivityTimestampUpdateForWrite({
          context,
          permissions: deferPermission,
          userId,
          now,
        })
      ).toEqual(buildActivityTimestampUpdate(true, userId, now));
    }
  });

  it('operational-only contexts never bump public', () => {
    for (const context of [
      'bulk',
      'historyNote',
      'sharedWithDelete',
      'transfer',
      'systemJob',
    ] as const) {
      expect(
        getActivityTimestampUpdateForWrite({
          context,
          permissions: deferPermission,
          userId,
          now,
        })
      ).toEqual(buildActivityTimestampUpdate(false, userId, now));
    }
  });

  it('throws ActivityTimestampPolicyError when renew is invalid', () => {
    expect(() =>
      getActivityTimestampUpdateForWrite({
        context: 'bulk',
        permissions: deferPermission,
        renewPublicLastUpdated: true,
        userId,
        now,
      })
    ).toThrow(ActivityTimestampPolicyError);

    expect(() =>
      resolveActivityTimestampBumpPublic({
        context: 'userPatch',
        permissions: [],
        renewPublicLastUpdated: true,
        userId,
        now,
      })
    ).toThrow(ActivityTimestampPolicyError);
  });
});
