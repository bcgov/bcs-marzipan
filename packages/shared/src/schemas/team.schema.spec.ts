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
      description: 'Description',
      sortOrder: 0,
      isActive: true,
      memberCount: 2,
      ministryCount: 1,
    });
    expect(result.id).toBe(1);
    expect(result.name).toBe('Team A');
    expect(result.memberCount).toBe(2);
    expect(result.ministryCount).toBe(1);
  });

  it('accepts null displayName and description', () => {
    const result = teamListItemSchema.parse({
      id: 2,
      name: 'Team B',
      displayName: null,
      description: null,
      sortOrder: 1,
      isActive: true,
      memberCount: 0,
      ministryCount: 0,
    });
    expect(result.displayName).toBeNull();
    expect(result.description).toBeNull();
  });
});

describe('createTeamBodySchema', () => {
  it('accepts valid create body with required name', () => {
    const result = createTeamBodySchema.parse({
      name: 'New Team',
    });
    expect(result.name).toBe('New Team');
  });

  it('accepts valid create body with optional fields', () => {
    const result = createTeamBodySchema.parse({
      name: 'New Team',
      displayName: 'Display',
      description: 'Desc',
      sortOrder: 1,
      isActive: true,
      ministryIds: ['1', '2'],
      notes: 'Note',
    });
    expect(result.ministryIds).toEqual(['1', '2']);
  });

  it('rejects empty name', () => {
    expect(() =>
      createTeamBodySchema.parse({
        name: '',
      })
    ).toThrow();
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
});
