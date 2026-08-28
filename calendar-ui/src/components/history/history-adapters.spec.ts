import { describe, expect, it } from 'vitest';

import {
  toActivityHistoryViewModel,
  toGlobalActivityHistoryViewModel,
} from './activity-history-adapter';
import { toTeamHistoryViewModel } from './team-history-adapter';
import { toUserHistoryViewModel } from './user-history-adapter';

describe('history adapters', () => {
  it('normalizes activity actors and excludes flag assignee metadata', () => {
    const result = toActivityHistoryViewModel({
      id: 1,
      activityId: 10,
      userId: 4,
      actionType: 'flag_assigned',
      timestamp: '2026-08-27T12:00:00Z',
      notes: null,
      changes: [
        {
          field: 'flag.assigneeName',
          oldValue: null,
          newValue: 'Jane Martinez',
        },
        { field: 'title', oldValue: 'Old', newValue: 'New' },
      ],
      actor: { id: 4, displayName: '', username: 'DOMAIN\\jane.martinez' },
    });

    expect(result.actor.name).toBe('Jane Martinez');
    expect(result.actionLabel).toBe('Activity assigned to Jane Martinez');
    expect(result.changes).toHaveLength(1);
  });

  it('suppresses system-generated activity history notes', () => {
    const result = toActivityHistoryViewModel({
      id: 1,
      activityId: 10,
      userId: 4,
      actionType: 'reviewed',
      timestamp: '2026-08-27T12:00:00Z',
      notes: 'Activity reviewed and updated',
      changes: [],
    });

    expect(result.notes).toBeNull();
  });

  it('preserves user-authored activity history notes', () => {
    const result = toActivityHistoryViewModel({
      id: 1,
      activityId: 10,
      userId: 4,
      actionType: 'updated',
      timestamp: '2026-08-27T12:00:00Z',
      notes: 'Updated title after minister feedback',
      changes: [],
    });

    expect(result.notes).toBe('Updated title after minister feedback');
  });

  it('adds global activity team and linked subject context', () => {
    const result = toGlobalActivityHistoryViewModel(
      {
        id: 1,
        activityId: 10,
        userId: 4,
        actionType: 'updated',
        timestamp: '2026-08-27T12:00:00Z',
        notes: null,
        changes: [],
        activity: {
          id: 10,
          displayId: 'ACT-10',
          title: 'Announcement',
          leadTeamId: 2,
          categories: [],
        },
      },
      { team: 'News', subjectState: { from: '/history' } }
    );

    expect(result.team).toBe('News');
    expect(result.subject).toEqual({
      label: 'ACT-10 Announcement',
      href: '/activity/10',
      state: { from: '/history' },
    });
  });

  it('preserves sentence-aware user changes', () => {
    const result = toUserHistoryViewModel(
      {
        id: 2,
        userId: 8,
        changedByUserId: 4,
        changedByUserName: 'Admin User',
        actionType: 'team_added',
        timestamp: '2026-08-27T12:00:00Z',
        notes: null,
        changes: [{ field: 'teamId', oldValue: null, newValue: 3 }],
      },
      { roleNamesById: {}, teamNamesById: { 3: 'Digital' } }
    );

    expect(result.actionLabel).toBe('Team added');
    expect(result.changes[0]).toMatchObject({
      kind: 'message',
      message: 'Team set to Digital',
    });
  });

  it('humanizes team actions, fields, and empty values', () => {
    const result = toTeamHistoryViewModel({
      id: 3,
      teamId: 2,
      changedByUserId: 4,
      actionType: 'ministry_list_updated',
      timestamp: '2026-08-27T12:00:00Z',
      notes: null,
      changes: [{ field: 'leadMinistryId', oldValue: null, newValue: 6 }],
    });

    expect(result.actor.name).toBe('User 4');
    expect(result.actionLabel).toBe('Ministry list updated');
    expect(result.changes[0]).toMatchObject({
      kind: 'transition',
      label: 'Lead ministry id',
      oldValue: 'None',
      newValue: '6',
    });
  });
});
