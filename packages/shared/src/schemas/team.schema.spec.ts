import { describe, expect, it } from 'vitest';

import {
  createTeamBodySchema,
  teamListItemSchema,
  updateTeamBodySchema,
} from './team.schema';

describe('teamListItemSchema', () => {
  it('accepts valid team list item', () => {
    const result = teamListItemSchema.parse({
      id: 1,
      name: 'Team A',
      displayName: 'Team A Display',
      abbreviation: 'TMA',
      description: 'Description',
      sortOrder: 0,
      isActive: true,
      appearsInShareWith: true,
      roleId: null,
      memberCount: 2,
      primaryOrganizationId: 1,
      primaryOrganizationName: 'Ministry One',
    });
    expect(result.id).toBe(1);
    expect(result.name).toBe('Team A');
    expect(result.memberCount).toBe(2);
    expect(result.appearsInShareWith).toBe(true);
    expect(result.primaryOrganizationId).toBe(1);
    expect(result.primaryOrganizationName).toBe('Ministry One');
  });

  it('accepts null displayName, description, and ministry', () => {
    const result = teamListItemSchema.parse({
      id: 2,
      name: 'Team B',
      displayName: null,
      abbreviation: 'TMB',
      description: null,
      sortOrder: 1,
      isActive: true,
      appearsInShareWith: false,
      roleId: null,
      memberCount: 0,
      primaryOrganizationId: null,
      primaryOrganizationName: null,
    });
    expect(result.displayName).toBeNull();
    expect(result.description).toBeNull();
    expect(result.appearsInShareWith).toBe(false);
    expect(result.primaryOrganizationId).toBeNull();
  });
});

describe('createTeamBodySchema', () => {
  it('accepts valid create body with required name and abbreviation', () => {
    const result = createTeamBodySchema.parse({
      name: 'New Team',
      abbreviation: 'NEW',
    });
    expect(result.name).toBe('New Team');
    expect(result.abbreviation).toBe('NEW');
  });

  it('accepts valid create body with optional fields', () => {
    const result = createTeamBodySchema.parse({
      name: 'New Team',
      abbreviation: 'NEW',
      displayName: 'Display',
      description: 'Desc',
      sortOrder: 1,
      isActive: true,
      primaryOrganizationId: 1,
      notes: 'Note',
    });
    expect(result.primaryOrganizationId).toBe(1);
  });

  it('enforces description max length (1000)', () => {
    createTeamBodySchema.parse({
      name: 'Team with description',
      abbreviation: 'TWD',
      description: 'd'.repeat(1000),
    });

    expect(() =>
      createTeamBodySchema.parse({
        name: 'Team with long description',
        abbreviation: 'TWL',
        description: 'd'.repeat(1001),
      })
    ).toThrow();
  });

  it('rejects empty name', () => {
    expect(() =>
      createTeamBodySchema.parse({
        name: '',
        abbreviation: 'AB',
      })
    ).toThrow();
  });

  it('rejects create body without abbreviation', () => {
    const result = createTeamBodySchema.safeParse({ name: 'New Team' });
    expect(result.success).toBe(false);
  });
});

describe('updateTeamBodySchema', () => {
  it('accepts valid update body with only name', () => {
    const result = updateTeamBodySchema.parse({
      name: 'Updated Name',
    });
    expect(result.name).toBe('Updated Name');
  });

  it('rejects empty name when provided', () => {
    expect(() =>
      updateTeamBodySchema.parse({
        name: '',
      })
    ).toThrow();
  });

  it('accepts optional abbreviation', () => {
    const result = updateTeamBodySchema.parse({ abbreviation: 'ABCDEF' });
    expect(result.abbreviation).toBe('ABCDEF');
  });

  it('enforces description max length on update (1000)', () => {
    updateTeamBodySchema.parse({ description: 'd'.repeat(1000) });
    expect(() =>
      updateTeamBodySchema.parse({ description: 'd'.repeat(1001) })
    ).toThrow();
  });

  it('rejects abbreviation longer than 6 characters', () => {
    const result = createTeamBodySchema.safeParse({
      name: 'T',
      abbreviation: 'ABCDEFG',
    });
    expect(result.success).toBe(false);
  });
});
