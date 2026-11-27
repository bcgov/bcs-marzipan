import { describe, expect, it } from 'vitest';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';
import { createMockActivityListItem } from '@corpcal/shared/test-utils/activity-list-item.fixture';
import { filterActivityRowsByFilters } from '@/lib/activity-query-utils';

import {
  mapActivityToTableRow,
  mapLegacyActivityToTableRow,
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

describe('mapLegacyActivityToTableRow', () => {
  it('uses the original ID, lookup status, and creation timestamp in the combined table', () => {
    const row = mapLegacyActivityToTableRow({
      id: 12,
      displayId: 'LEG-1001',
      title: 'Historical activity',
      summary: null,
      startDate: '2025-01-14',
      endDate: null,
      activityStatusId: 8,
      activityStatus: 'Archived',
      lookAheadStatus: null,
      leadOrgName: null,
      ministryName: null,
      locationName: null,
      commsMaterials: ['News release'],
      translations: ['French'],
      commsContactName: 'Jane Smith',
      createdDateTime: '2024-12-01T12:00:00.000Z',
      importedAt: '2026-01-01T12:00:00.000Z',
    });

    expect(row.displayId).toBe('LEG-1001');
    expect(row.activityStatusId).toBe(8);
    expect(row.activityStatus).toBe('Archived');
    expect(row.commsMaterials).toEqual(['News release']);
    expect(row.translationsRequired).toEqual(['French']);
    expect(row.createdDateTime).toBe('2024-12-01T12:00:00.000Z');
    expect(
      filterActivityRowsByFilters([row], {
        ...DEFAULT_ACTIVITY_FILTER_STATE,
        activityStatusIds: [8],
      })
    ).toEqual([row]);
  });
});
