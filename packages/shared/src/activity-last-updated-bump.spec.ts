import { describe, expect, it } from 'vitest';

import { resolveBumpPublicLastUpdated } from './activity-last-updated-bump';
import { PERMISSIONS } from './auth/constants';

const deferPermission = [PERMISSIONS.ACTIVITIES.PUBLIC_LAST_UPDATED_DEFER];

describe('resolveBumpPublicLastUpdated', () => {
  it('rejects renewPublicLastUpdated outside userPatch', () => {
    const result = resolveBumpPublicLastUpdated({
      context: 'bulk',
      permissions: deferPermission,
      renewPublicLastUpdated: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('bad_request');
    }
  });

  it('rejects renewPublicLastUpdated without defer permission', () => {
    const result = resolveBumpPublicLastUpdated({
      context: 'userPatch',
      permissions: [],
      renewPublicLastUpdated: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('forbidden');
    }
  });

  it('userPatch: non-defer always bumps public', () => {
    expect(
      resolveBumpPublicLastUpdated({
        context: 'userPatch',
        permissions: [],
      })
    ).toEqual({ ok: true, bumpPublic: true });
  });

  it('userPatch: defer defaults to operational-only public bump', () => {
    expect(
      resolveBumpPublicLastUpdated({
        context: 'userPatch',
        permissions: deferPermission,
      })
    ).toEqual({ ok: true, bumpPublic: false });
  });

  it('userPatch: defer renews public when flag true', () => {
    expect(
      resolveBumpPublicLastUpdated({
        context: 'userPatch',
        permissions: deferPermission,
        renewPublicLastUpdated: true,
      })
    ).toEqual({ ok: true, bumpPublic: true });
  });

  it('junction: defer skips public bump', () => {
    expect(
      resolveBumpPublicLastUpdated({
        context: 'junction',
        permissions: deferPermission,
      })
    ).toEqual({ ok: true, bumpPublic: false });
  });

  it('junction: non-defer bumps public', () => {
    expect(
      resolveBumpPublicLastUpdated({
        context: 'junction',
        permissions: [],
      })
    ).toEqual({ ok: true, bumpPublic: true });
  });

  it('meta paths skip public bump', () => {
    for (const context of [
      'bulk',
      'historyNote',
      'sharedWithDelete',
      'transfer',
      'systemJob',
    ] as const) {
      expect(
        resolveBumpPublicLastUpdated({
          context,
          permissions: deferPermission,
        })
      ).toEqual({ ok: true, bumpPublic: false });
    }
  });

  it('status paths force public bump', () => {
    for (const context of [
      'softDelete',
      'restore',
      'deleteRequested',
      'create',
    ] as const) {
      expect(
        resolveBumpPublicLastUpdated({
          context,
          permissions: deferPermission,
        })
      ).toEqual({ ok: true, bumpPublic: true });
    }
  });
});
