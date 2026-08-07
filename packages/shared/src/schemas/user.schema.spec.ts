import { describe, expect, it } from 'vitest';

import {
  addUserToTeamBodySchema,
  createUserBodySchema,
  removeUserFromTeamBodySchema,
  TEAM_ROLES,
  transferActivitiesBodySchema,
  updateUserBodySchema,
  updateUserSettingsBodySchema,
  updateUserTeamRoleBodySchema,
  userDetailSchema,
  userListItemSchema,
} from './user.schema';

describe('userListItemSchema', () => {
  it('accepts valid user list item', () => {
    const result = userListItemSchema.parse({
      id: 1,
      adUsername: 'user1',
      adDisplayName: 'User One',
      adEmail: 'user@example.com',
      roleId: 2,
      roleName: 'Editor',
      isActive: true,
      teams: [{ teamId: 1, teamName: 'Team One', role: 'member' }],
    });
    expect(result.id).toBe(1);
    expect(result.roleName).toBe('Editor');
    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].role).toBe('member');
  });

  it('accepts null ad fields', () => {
    const result = userListItemSchema.parse({
      id: 2,
      adUsername: null,
      adDisplayName: null,
      adEmail: null,
      roleId: 1,
      roleName: 'Admin',
      isActive: false,
      teams: [],
    });
    expect(result.adUsername).toBeNull();
    expect(result.teams).toEqual([]);
  });
});

describe('createUserBodySchema', () => {
  it('accepts valid body with email and roleId', () => {
    const result = createUserBodySchema.parse({
      email: 'user@example.gov.bc.ca',
      roleId: 1,
    });
    expect(result.email).toBe('user@example.gov.bc.ca');
    expect(result.roleId).toBe(1);
    expect(result.displayName).toBeUndefined();
    expect(result.teams).toBeUndefined();
  });

  it('accepts optional displayName and teams', () => {
    const result = createUserBodySchema.parse({
      email: 'user@example.com',
      roleId: 2,
      displayName: 'Jane Doe',
      teams: [
        { teamId: 1, role: 'member' },
        { teamId: 2, role: 'owner' },
      ],
    });
    expect(result.displayName).toBe('Jane Doe');
    expect(result.teams).toHaveLength(2);
    expect(result.teams?.[0].role).toBe('member');
    expect(result.teams?.[1].role).toBe('owner');
  });

  it('enforces displayName max length (255)', () => {
    const valid = createUserBodySchema.parse({
      email: 'user@example.com',
      roleId: 2,
      displayName: 'd'.repeat(255),
    });
    expect(valid.displayName).toBe('d'.repeat(255));

    expect(() =>
      createUserBodySchema.parse({
        email: 'user@example.com',
        roleId: 2,
        displayName: 'd'.repeat(256),
      })
    ).toThrow();
  });

  it('rejects missing email', () => {
    expect(() => createUserBodySchema.parse({ roleId: 1 })).toThrow();
  });

  it('rejects missing roleId', () => {
    expect(() =>
      createUserBodySchema.parse({ email: 'u@example.com' })
    ).toThrow();
  });

  it('rejects invalid email format', () => {
    expect(() =>
      createUserBodySchema.parse({
        email: 'not-an-email',
        roleId: 1,
      })
    ).toThrow();
  });

  it('rejects empty email', () => {
    expect(() =>
      createUserBodySchema.parse({ email: '   ', roleId: 1 })
    ).toThrow();
  });
});

describe('addUserToTeamBodySchema', () => {
  it('accepts valid add user to team body', () => {
    const result = addUserToTeamBodySchema.parse({
      teamId: 1,
      role: 'member',
    });
    expect(result.teamId).toBe(1);
    expect(result.role).toBe('member');
  });

  it('accepts both TEAM_ROLES', () => {
    for (const role of TEAM_ROLES) {
      const result = addUserToTeamBodySchema.parse({ teamId: 1, role });
      expect(result.role).toBe(role);
    }
  });

  it('enforces notes max length (1000)', () => {
    addUserToTeamBodySchema.parse({
      teamId: 1,
      role: 'member',
      notes: 'n'.repeat(1000),
    });

    expect(() =>
      addUserToTeamBodySchema.parse({
        teamId: 1,
        role: 'member',
        notes: 'n'.repeat(1001),
      })
    ).toThrow();
  });

  it('rejects invalid role', () => {
    expect(() =>
      addUserToTeamBodySchema.parse({
        teamId: 1,
        role: 'invalid',
      })
    ).toThrow();
  });
});

describe('updateUserTeamRoleBodySchema', () => {
  it('accepts valid update role body', () => {
    const result = updateUserTeamRoleBodySchema.parse({ role: 'owner' });
    expect(result.role).toBe('owner');
  });

  it('enforces notes max length (1000)', () => {
    updateUserTeamRoleBodySchema.parse({
      role: 'owner',
      notes: 'n'.repeat(1000),
    });

    expect(() =>
      updateUserTeamRoleBodySchema.parse({
        role: 'owner',
        notes: 'n'.repeat(1001),
      })
    ).toThrow();
  });
});

describe('updateUserBodySchema', () => {
  it('enforces notes max length (1000)', () => {
    updateUserBodySchema.parse({ notes: 'n'.repeat(1000) });

    expect(() =>
      updateUserBodySchema.parse({ notes: 'n'.repeat(1001) })
    ).toThrow();
  });
});

describe('transferActivitiesBodySchema', () => {
  it('accepts a valid transfer body', () => {
    const result = transferActivitiesBodySchema.parse({
      targetUserId: 2,
      fromTeamId: 1,
      includeNonLead: false,
    });
    expect(result.targetUserId).toBe(2);
    expect(result.fromTeamId).toBe(1);
    expect(result.toTeamId).toBeUndefined();
    expect(result.includeNonLead).toBe(false);
  });

  it('accepts optional toTeamId and activityIds', () => {
    const result = transferActivitiesBodySchema.parse({
      targetUserId: 2,
      fromTeamId: 1,
      toTeamId: 3,
      includeNonLead: true,
      activityIds: [1, 2, 3],
    });
    expect(result.toTeamId).toBe(3);
    expect(result.activityIds).toEqual([1, 2, 3]);
  });

  it('rejects an explicit empty activityIds array', () => {
    expect(() =>
      transferActivitiesBodySchema.parse({
        targetUserId: 2,
        fromTeamId: 1,
        includeNonLead: false,
        activityIds: [],
      })
    ).toThrow();
  });

  it('requires fromTeamId', () => {
    expect(() =>
      transferActivitiesBodySchema.parse({
        targetUserId: 2,
        includeNonLead: true,
      })
    ).toThrow();
  });

  it('enforces notes max length (1000)', () => {
    transferActivitiesBodySchema.parse({
      targetUserId: 2,
      fromTeamId: 1,
      includeNonLead: true,
      notes: 'n'.repeat(1000),
    });

    expect(() =>
      transferActivitiesBodySchema.parse({
        targetUserId: 2,
        fromTeamId: 1,
        includeNonLead: true,
        notes: 'n'.repeat(1001),
      })
    ).toThrow();
  });
});

describe('removeUserFromTeamBodySchema', () => {
  it('defaults to an empty, valid body when omitted', () => {
    const result = removeUserFromTeamBodySchema.parse(undefined);
    expect(result).toEqual({ includeNonLead: false });
  });

  it('accepts an empty object (silent removal, no comms to transfer)', () => {
    const result = removeUserFromTeamBodySchema.parse({});
    expect(result.targetUserId).toBeUndefined();
    expect(result.includeNonLead).toBe(false);
  });

  it('accepts a full transfer payload', () => {
    const result = removeUserFromTeamBodySchema.parse({
      targetUserId: 2,
      toTeamId: 3,
      includeNonLead: true,
      notes: 'reason',
    });
    expect(result).toEqual({
      targetUserId: 2,
      toTeamId: 3,
      includeNonLead: true,
      notes: 'reason',
    });
  });

  it('enforces notes max length (1000)', () => {
    expect(() =>
      removeUserFromTeamBodySchema.parse({ notes: 'n'.repeat(1001) })
    ).toThrow();
  });
});

describe('userDetailSchema', () => {
  const base = {
    id: 1,
    adUsername: 'user1',
    adDisplayName: 'User One',
    adEmail: 'user@example.com',
    roleId: 2,
    roleName: 'Editor',
    isActive: true,
    teams: [],
    notes: null,
    flagColour: null,
  };

  it('accepts null flagColour', () => {
    const result = userDetailSchema.parse(base);
    expect(result.flagColour).toBeNull();
  });

  it('accepts a hex flagColour string', () => {
    const result = userDetailSchema.parse({ ...base, flagColour: '#FF5733' });
    expect(result.flagColour).toBe('#FF5733');
  });
});

describe('updateUserSettingsBodySchema', () => {
  it('accepts a valid 6-digit hex colour', () => {
    const result = updateUserSettingsBodySchema.parse({
      flagColour: '#1A2B3C',
    });
    expect(result.flagColour).toBe('#1A2B3C');
  });

  it('accepts uppercase hex', () => {
    const result = updateUserSettingsBodySchema.parse({
      flagColour: '#AABBCC',
    });
    expect(result.flagColour).toBe('#AABBCC');
  });

  it('accepts null to reset to default', () => {
    const result = updateUserSettingsBodySchema.parse({ flagColour: null });
    expect(result.flagColour).toBeNull();
  });

  it('rejects a colour missing the # prefix', () => {
    expect(() =>
      updateUserSettingsBodySchema.parse({ flagColour: 'FF5733' })
    ).toThrow();
  });

  it('rejects a 3-digit short hex', () => {
    expect(() =>
      updateUserSettingsBodySchema.parse({ flagColour: '#FFF' })
    ).toThrow();
  });

  it('rejects non-hex characters', () => {
    expect(() =>
      updateUserSettingsBodySchema.parse({ flagColour: '#GGGGGG' })
    ).toThrow();
  });
});
