import { describe, expect, it } from 'vitest';

import { createMockActivityListItem } from '@corpcal/shared/test-utils/activity-list-item.fixture';

import { mapActivityToTableRow } from './activityTableRow';

describe('mapActivityToTableRow', () => {
  it('maps sharedWith, leadTeamDisplayName, and comms lead name', () => {
    const row = mapActivityToTableRow(
      createMockActivityListItem({
        sharedWith: ['Comms Team', 'Events Team'],
        sharedWithTeamIds: [10, 20],
        leadTeamDisplayName: 'HLTH Comms',
        commsContacts: [
          {
            userId: 5,
            name: 'Jane Smith',
            isLead: true,
          },
          {
            userId: 6,
            name: 'Other Contact',
            isLead: false,
          },
        ],
      })
    );

    expect(row.sharedWith).toEqual(['Comms Team', 'Events Team']);
    expect(row.sharedWithTeamIds).toEqual([10, 20]);
    expect(row.leadTeamDisplayName).toBe('HLTH Comms');
    expect(row.commsLeadName).toBe('Jane Smith');
    expect(row.commsContactsCount).toBe(2);
  });

  it('defaults sharedWith to empty array when absent', () => {
    const row = mapActivityToTableRow(
      createMockActivityListItem({
        sharedWith: undefined,
        leadTeamDisplayName: null,
        commsContacts: [{ userId: 1, name: 'Lead', isLead: true }],
      })
    );

    expect(row.sharedWith).toEqual([]);
    expect(row.leadTeamDisplayName).toBeNull();
  });

  it('maps editLock when present on list items', () => {
    const row = mapActivityToTableRow(
      createMockActivityListItem({
        editLock: { userId: 42, username: 'Editor User' },
      })
    );
    expect(row.editLock).toEqual({ userId: 42, username: 'Editor User' });
  });
});
