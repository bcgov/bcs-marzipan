import { describe, expect, it } from 'vitest';

import {
  addUserToTeamBodySchema,
  TEAM_ROLES,
  transferActivitiesBodySchema,
  updateUserTeamRoleBodySchema,
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

  it('rejects invalid role', () => {
    expect(() =>
      addUserToTeamBodySchema.parse({
        teamId: 1,
        // @ts-expect-error Testing invalid value
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
});

describe('transferActivitiesBodySchema', () => {
  it('accepts valid transfer body with at least one flag true', () => {
    const result = transferActivitiesBodySchema.parse({
      targetUserId: 2,
      transferCommsLead: true,
      transferCommsContact: false,
    });
    expect(result.targetUserId).toBe(2);
    expect(result.transferCommsLead).toBe(true);
  });

  it('accepts optional activityIds', () => {
    const result = transferActivitiesBodySchema.parse({
      targetUserId: 2,
      transferCommsLead: true,
      transferCommsContact: true,
      activityIds: [1, 2, 3],
    });
    expect(result.activityIds).toEqual([1, 2, 3]);
  });
});
