import { describe, expect, it } from 'vitest';

import { createMockActivityListItem } from '@corpcal/shared/test-utils/activity-list-item.fixture';

import {
  mapActivityToTableRow,
  resolveCommsContactName,
} from './activityTableRow';

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
    expect(row.commsContactName).toBe('Jane Smith');
  });

  it('uses the first listed contact when no comms lead is designated', () => {
    const row = mapActivityToTableRow(
      createMockActivityListItem({
        commsContacts: [
          { userId: 6, name: 'Backup Contact', isLead: false },
          { userId: 7, name: 'Second Contact', isLead: false },
        ],
      })
    );

    expect(row.commsLeadName).toBeNull();
    expect(row.commsContactName).toBe('Backup Contact');
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

  it('resolveCommsContactName prefers lead over other contacts', () => {
    expect(
      resolveCommsContactName([
        { userId: 1, name: 'Other', isLead: false },
        { userId: 2, name: 'Lead Person', isLead: true },
      ])
    ).toBe('Lead Person');
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
