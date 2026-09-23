import { describe, expect, it } from 'vitest';

import { PERMISSIONS, SYSTEM_ROLES } from './auth/constants';
import {
  canViewHistoryAudience,
  resolveHistoryAudience,
  shouldIncludeAudienceInHistoryResponse,
} from './history-audience';

const internalOnly = [PERMISSIONS.ACTIVITIES.HISTORY_AUDIENCE_INTERNAL];
const privateOnly = [PERMISSIONS.ACTIVITIES.HISTORY_AUDIENCE_PRIVATE];
const bothAudience = [
  PERMISSIONS.ACTIVITIES.HISTORY_AUDIENCE_INTERNAL,
  PERMISSIONS.ACTIVITIES.HISTORY_AUDIENCE_PRIVATE,
];

describe('resolveHistoryAudience', () => {
  it('defaults to public when caller lacks audience permissions', () => {
    expect(resolveHistoryAudience(undefined, [])).toEqual({
      ok: true,
      audience: 'public',
    });
  });

  it('defaults to internal when caller has internal permission and audience omitted', () => {
    expect(resolveHistoryAudience(undefined, internalOnly)).toEqual({
      ok: true,
      audience: 'internal',
    });
  });

  it('defaults to public when caller has only private permission and audience omitted', () => {
    expect(resolveHistoryAudience(undefined, privateOnly)).toEqual({
      ok: true,
      audience: 'public',
    });
  });

  it('rejects internal without permission', () => {
    const result = resolveHistoryAudience('internal', []);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('forbidden');
    }
  });

  it('accepts explicit public for any caller', () => {
    expect(resolveHistoryAudience('public', [])).toEqual({
      ok: true,
      audience: 'public',
    });
  });

  it('accepts private when permitted', () => {
    expect(resolveHistoryAudience('private', privateOnly)).toEqual({
      ok: true,
      audience: 'private',
    });
  });
});

describe('canViewHistoryAudience', () => {
  const actor = { userId: 10, permissions: bothAudience };
  const otherAdmin = { userId: 20, permissions: bothAudience };
  const sysAdmin = {
    userId: 30,
    permissions: [],
    roleName: SYSTEM_ROLES.SYSTEM_ADMIN,
  };

  it('allows everyone to see public entries', () => {
    expect(
      canViewHistoryAudience(
        { userId: 1, permissions: [] },
        { audience: 'public', userId: 99 }
      )
    ).toBe(true);
  });

  it('restricts internal to permission holders', () => {
    expect(
      canViewHistoryAudience(otherAdmin, {
        audience: 'internal',
        userId: actor.userId,
      })
    ).toBe(true);
    expect(
      canViewHistoryAudience(
        { userId: 1, permissions: [] },
        { audience: 'internal', userId: 99 }
      )
    ).toBe(false);
  });

  it('allows System Admin to see internal without explicit permission', () => {
    expect(
      canViewHistoryAudience(sysAdmin, {
        audience: 'internal',
        userId: actor.userId,
      })
    ).toBe(true);
  });

  it('allows private for the actor only, not other permission holders', () => {
    expect(
      canViewHistoryAudience(
        { userId: actor.userId, permissions: [] },
        { audience: 'private', userId: actor.userId }
      )
    ).toBe(true);
    expect(
      canViewHistoryAudience(otherAdmin, {
        audience: 'private',
        userId: actor.userId,
      })
    ).toBe(false);
  });

  it('allows System Admin to see any private entry', () => {
    expect(
      canViewHistoryAudience(sysAdmin, {
        audience: 'private',
        userId: actor.userId,
      })
    ).toBe(true);
  });
});

describe('shouldIncludeAudienceInHistoryResponse', () => {
  it('is false for public-only viewers', () => {
    expect(shouldIncludeAudienceInHistoryResponse([])).toBe(false);
  });

  it('is true when internal or private permission is held', () => {
    expect(shouldIncludeAudienceInHistoryResponse(internalOnly)).toBe(true);
  });
});
