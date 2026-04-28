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
      roleId: null,
      memberCount: 2,
      ministryId: 1,
      ministryName: 'Ministry One',
    });
    expect(result.id).toBe(1);
    expect(result.name).toBe('Team A');
    expect(result.memberCount).toBe(2);
    expect(result.ministryId).toBe(1);
    expect(result.ministryName).toBe('Ministry One');
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
      roleId: null,
      memberCount: 0,
      ministryId: null,
      ministryName: null,
    });
    expect(result.displayName).toBeNull();
    expect(result.description).toBeNull();
    expect(result.ministryId).toBeNull();
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
      ministryId: 1,
      notes: 'Note',
    });
    expect(result.ministryId).toBe(1);
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
    const result = updateTeamBodySchema.parse({ abbreviation: 'ABBR' });
    expect(result.abbreviation).toBe('ABBR');
  });

  it('rejects abbreviation longer than 5 characters', () => {
    const result = createTeamBodySchema.safeParse({
      name: 'T',
      abbreviation: 'ABCDEF',
    });
    expect(result.success).toBe(false);
  });
});
