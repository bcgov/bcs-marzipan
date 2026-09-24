import { describe, expect, it } from 'vitest';

import {
  globalActivityHistoryPageSchema,
  teamHistoryEntrySchema,
  userHistoryEntrySchema,
} from './history.schema';

describe('globalActivityHistoryPageSchema', () => {
  it('accepts a paginated global history page', () => {
    const result = globalActivityHistoryPageSchema.parse({
      items: [
        {
          id: 1,
          activityId: 10,
          userId: 2,
          actionType: 'updated',
          changes: null,
          notes: null,
          timestamp: '2025-01-15T12:00:00.000Z',
          activity: {
            id: 10,
            displayId: 'MIN-000010',
            title: 'Cabinet meeting',
            leadTeamId: 3,
            categories: ['Events'],
          },
        },
      ],
      page: 1,
      pageSize: 50,
      hasNext: false,
      totalItems: 1,
    });
    expect(result.items).toHaveLength(1);
    expect(result.totalItems).toBe(1);
  });
});

describe('teamHistoryEntrySchema', () => {
  it('accepts valid team history entry', () => {
    const result = teamHistoryEntrySchema.parse({
      id: 1,
      teamId: 1,
      changedByUserId: 2,
      actionType: 'created',
      changes: null,
      notes: null,
      timestamp: '2025-01-15T12:00:00.000Z',
      changedByUserName: 'Admin User',
    });
    expect(result.id).toBe(1);
    expect(result.teamId).toBe(1);
    expect(result.actionType).toBe('created');
    expect(result.timestamp).toBe('2025-01-15T12:00:00.000Z');
    expect(result.changedByUserName).toBe('Admin User');
  });

  it('accepts changes array', () => {
    const result = teamHistoryEntrySchema.parse({
      id: 2,
      teamId: 1,
      changedByUserId: 2,
      actionType: 'updated',
      changes: [{ field: 'name', oldValue: 'Old', newValue: 'New' }],
      notes: null,
      timestamp: '2025-01-15T12:00:00.000Z',
    });
    expect(result.changes).toHaveLength(1);
    expect(result.changes![0].field).toBe('name');
  });
});

describe('userHistoryEntrySchema', () => {
  it('accepts valid user history entry', () => {
    const result = userHistoryEntrySchema.parse({
      id: 1,
      userId: 1,
      changedByUserId: 2,
      actionType: 'role_changed',
      changes: null,
      notes: null,
      timestamp: '2025-01-15T12:00:00.000Z',
      changedByUserName: 'Admin User',
    });
    expect(result.id).toBe(1);
    expect(result.userId).toBe(1);
    expect(result.actionType).toBe('role_changed');
    expect(result.changedByUserName).toBe('Admin User');
  });

  it('accepts changes array', () => {
    const result = userHistoryEntrySchema.parse({
      id: 2,
      userId: 1,
      changedByUserId: 2,
      actionType: 'team_added',
      changes: [{ field: 'teamId', oldValue: null, newValue: 5 }],
      notes: null,
      timestamp: '2025-01-15T12:00:00.000Z',
    });
    expect(result.changes).toHaveLength(1);
    expect(result.changes![0].field).toBe('teamId');
  });
});
