import { describe, expect, it } from 'vitest';

import {
  formatHistoryFieldValue,
  type LookupMaps,
} from './activity-history-format';

// Minimal lookup maps used across multiple tests
const maps: LookupMaps = {
  usersMap: new Map([[1, 'Alice Smith']]),
  dateStatusMap: new Map([[2, 'Tentative']]),
  venueStatusMap: new Map([[3, 'Confirmed']]),
  activityStatusMap: new Map([[4, 'Active']]),
  timeStatusMap: new Map([[5, 'Morning']]),
  pitchRequiredStatusMap: new Map([[6, 'Required']]),
  translationsRequiredStatusMap: new Map([[7, 'Required']]),
  newsReleaseOriginMap: new Map([[8, 'Government']]),
  newsReleaseDistributionMap: new Map([[9, 'Wide']]),
  premierRequestedMap: new Map([[10, 'Yes']]),
  teamsMap: new Map([[11, 'Communications Team']]),
  ministriesMap: new Map([[12, 'Ministry of Finance']]),
  organizationsMap: new Map([[13, 'Acme Corp']]),
  eventPlannersMap: new Map([[14, 'Event Co.']]),
  categoriesMap: new Map([[15, 'Announcement']]),
  tagsMap: new Map([[16, 'Priority']]),
  commsMaterialsMap: new Map([[17, 'Press Release']]),
  translationLanguagesMap: new Map([[18, 'French']]),
  sharedWithTeamsMap: new Map([[19, 'Policy Team']]),
  governmentRepresentativesMap: new Map([[20, 'Minister Jane Doe']]),
};

describe('formatHistoryFieldValue', () => {
  // ── Empty / null ──────────────────────────────────────────────────────────

  describe('empty / null values', () => {
    it('returns "(empty)" for null', () => {
      expect(formatHistoryFieldValue('title', null)).toBe('(empty)');
    });

    it('returns "(empty)" for undefined', () => {
      expect(formatHistoryFieldValue('title', undefined)).toBe('(empty)');
    });

    it('returns "(empty)" for empty string', () => {
      expect(formatHistoryFieldValue('title', '')).toBe('(empty)');
    });
  });

  // ── Rich text fields ──────────────────────────────────────────────────────

  describe('rich text fields (summary, significance, executiveSummary)', () => {
    it('extracts plain text from a ProseMirror JSON string', () => {
      const json = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      });
      expect(formatHistoryFieldValue('summary', json)).toBe('Hello world');
    });

    it('returns plain string as-is when it is not ProseMirror JSON', () => {
      expect(formatHistoryFieldValue('significance', 'Plain text')).toBe(
        'Plain text'
      );
    });

    it('returns "(empty)" for an empty rich text doc', () => {
      const empty = JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph' }],
      });
      expect(formatHistoryFieldValue('executiveSummary', empty)).toBe(
        '(empty)'
      );
    });
  });

  // ── Boolean fields ────────────────────────────────────────────────────────

  describe('boolean values', () => {
    it('returns "Yes" for true', () => {
      expect(formatHistoryFieldValue('isIssue', true)).toBe('Yes');
    });

    it('returns "No" for false', () => {
      expect(formatHistoryFieldValue('isAllDay', false)).toBe('No');
    });
  });

  // ── User FK fields ────────────────────────────────────────────────────────

  describe('lastUpdatedBy / createdBy', () => {
    it('resolves userId to display name', () => {
      expect(formatHistoryFieldValue('lastUpdatedBy', 1, maps)).toBe(
        'Alice Smith'
      );
      expect(formatHistoryFieldValue('createdBy', 1, maps)).toBe('Alice Smith');
    });

    it('falls back to raw number when not in map', () => {
      expect(formatHistoryFieldValue('lastUpdatedBy', 99, maps)).toBe('99');
    });

    it('falls back to raw number when no usersMap provided', () => {
      expect(formatHistoryFieldValue('lastUpdatedBy', 1)).toBe('1');
    });
  });

  // ── Status ID fields ──────────────────────────────────────────────────────

  describe('status ID fields', () => {
    it.each([
      ['dateStatusId', 2, 'Tentative'],
      ['venueStatusId', 3, 'Confirmed'],
      ['activityStatusId', 4, 'Active'],
      ['timeStatusId', 5, 'Morning'],
      ['pitchRequiredStatusId', 6, 'Required'],
      ['translationsRequiredStatusId', 7, 'Required'],
      ['newsReleaseOriginId', 8, 'Government'],
      ['newsReleaseDistributionId', 9, 'Wide'],
      ['premierRequestedId', 10, 'Yes'],
    ] as const)('resolves %s → "%s"', (field, id, expected) => {
      expect(formatHistoryFieldValue(field, id, maps)).toBe(expected);
    });

    it('falls back to raw string ID when not in map', () => {
      expect(formatHistoryFieldValue('dateStatusId', 999, maps)).toBe('999');
    });

    it('falls back to raw string when no map provided', () => {
      expect(formatHistoryFieldValue('dateStatusId', 2)).toBe('2');
    });
  });

  // ── Lead FK fields ────────────────────────────────────────────────────────

  describe('lead FK fields', () => {
    it('resolves leadTeamId to team name', () => {
      expect(formatHistoryFieldValue('leadTeamId', 11, maps)).toBe(
        'Communications Team'
      );
    });

    it('resolves leadMinistryId to ministry name', () => {
      expect(formatHistoryFieldValue('leadMinistryId', 12, maps)).toBe(
        'Ministry of Finance'
      );
    });

    it('resolves leadOrgId to organization name', () => {
      expect(formatHistoryFieldValue('leadOrgId', 13, maps)).toBe('Acme Corp');
    });

    it('falls back to raw number when not in map', () => {
      expect(formatHistoryFieldValue('leadTeamId', 999, maps)).toBe('999');
    });
  });

  // ── Enum display fields ───────────────────────────────────────────────────

  describe('visibility', () => {
    it('formats "global" as "Global"', () => {
      expect(formatHistoryFieldValue('visibility', 'global')).toBe('Global');
    });

    it('formats "team" as "Team only"', () => {
      expect(formatHistoryFieldValue('visibility', 'team')).toBe('Team only');
    });

    it('passes through unknown values unchanged', () => {
      expect(formatHistoryFieldValue('visibility', 'unknown_value')).toBe(
        'unknown_value'
      );
    });
  });

  describe('lookAheadStatus', () => {
    it.each([
      ['none', 'None'],
      ['new', 'New'],
      ['changed', 'Changed'],
    ] as const)('formats "%s" as "%s"', (value, expected) => {
      expect(formatHistoryFieldValue('lookAheadStatus', value)).toBe(expected);
    });

    it('passes through unknown values unchanged', () => {
      expect(formatHistoryFieldValue('lookAheadStatus', 'future_value')).toBe(
        'future_value'
      );
    });
  });

  // ── ID array fields ───────────────────────────────────────────────────────

  describe('ID array fields', () => {
    it.each([
      ['categoryIds', [15], 'Announcement'],
      ['tagIds', [16], 'Priority'],
      ['commsMaterialIds', [17], 'Press Release'],
      ['translationLanguageIds', [18], 'French'],
      ['sharedWithTeamIds', [19], 'Policy Team'],
    ] as const)('%s resolves IDs to names', (field, ids, expected) => {
      expect(formatHistoryFieldValue(field, ids, maps)).toBe(expected);
    });

    it('returns "(none)" for empty array', () => {
      expect(formatHistoryFieldValue('categoryIds', [], maps)).toBe('(none)');
    });

    it('returns count fallback when no map provided', () => {
      expect(formatHistoryFieldValue('categoryIds', [1, 2])).toBe('2 item(s)');
    });

    it('falls back to "#id" for IDs not in map', () => {
      expect(formatHistoryFieldValue('categoryIds', [999], maps)).toBe('#999');
    });

    it('joins multiple IDs with ", "', () => {
      const mapsWithTwo: LookupMaps = {
        categoriesMap: new Map([
          [1, 'Alpha'],
          [2, 'Beta'],
        ]),
      };
      expect(formatHistoryFieldValue('categoryIds', [1, 2], mapsWithTwo)).toBe(
        'Alpha, Beta'
      );
    });
  });

  // ── venueAddress ──────────────────────────────────────────────────────────

  describe('venueAddress', () => {
    it('joins all address parts with ", "', () => {
      expect(
        formatHistoryFieldValue('venueAddress', {
          venueName: 'Convention Centre',
          addressLine1: '123 Main St',
          addressLine2: 'Suite 4',
          city: 'Victoria',
          provinceOrState: 'BC',
          country: 'Canada',
        })
      ).toBe('Convention Centre, 123 Main St, Suite 4, Victoria, BC, Canada');
    });

    it('omits null/undefined address parts', () => {
      expect(
        formatHistoryFieldValue('venueAddress', {
          venueName: null,
          addressLine1: '123 Main St',
          city: 'Victoria',
        })
      ).toBe('123 Main St, Victoria');
    });

    it('returns "(address set)" when all parts are null/missing', () => {
      expect(formatHistoryFieldValue('venueAddress', {})).toBe('(address set)');
    });
  });

  // ── eventPlanners ─────────────────────────────────────────────────────────

  describe('eventPlanners', () => {
    it('uses eventPlannerName when present', () => {
      expect(
        formatHistoryFieldValue('eventPlanners', [
          { eventPlannerName: 'Jane Events', isLead: true },
        ])
      ).toBe('Jane Events');
    });

    it('resolves eventPlannerId via eventPlannersMap', () => {
      expect(
        formatHistoryFieldValue(
          'eventPlanners',
          [{ eventPlannerId: 14, isLead: false }],
          maps
        )
      ).toBe('Event Co.');
    });

    it('falls back to "ID {n}" when ID not in map', () => {
      expect(
        formatHistoryFieldValue(
          'eventPlanners',
          [{ eventPlannerId: 999, isLead: false }],
          maps
        )
      ).toBe('ID 999');
    });

    it('returns "(no event planners)" for empty array', () => {
      expect(formatHistoryFieldValue('eventPlanners', [])).toBe(
        '(no event planners)'
      );
    });
  });

  // ── representatives ───────────────────────────────────────────────────────

  describe('representatives', () => {
    it('resolves representativeId via governmentRepresentativesMap', () => {
      expect(
        formatHistoryFieldValue(
          'representatives',
          [{ representativeId: 20 }],
          maps
        )
      ).toBe('Minister Jane Doe');
    });

    it('uses representativeName as fallback when ID not in map', () => {
      expect(
        formatHistoryFieldValue(
          'representatives',
          [{ representativeId: 999, representativeName: 'Freeform Name' }],
          maps
        )
      ).toBe('Freeform Name');
    });

    it('falls back to "Rep {id}" when ID not in map and no name', () => {
      expect(
        formatHistoryFieldValue(
          'representatives',
          [{ representativeId: 999 }],
          maps
        )
      ).toBe('Rep 999');
    });

    it('uses representativeName for freeform entries (no ID)', () => {
      expect(
        formatHistoryFieldValue('representatives', [
          { representativeName: 'Freeform Person' },
        ])
      ).toBe('Freeform Person');
    });

    it('returns "(no representatives)" for empty array', () => {
      expect(formatHistoryFieldValue('representatives', [])).toBe(
        '(no representatives)'
      );
    });
  });

  // ── commsContacts ─────────────────────────────────────────────────────────

  describe('commsContacts', () => {
    it('returns "(no contacts)" for empty array', () => {
      expect(formatHistoryFieldValue('commsContacts', [])).toBe(
        '(no contacts)'
      );
    });

    it('formats server-resolved shape with lead marker', () => {
      expect(
        formatHistoryFieldValue('commsContacts', [
          { userName: 'Alice', isLead: true },
          { userName: 'Bob', isLead: false },
        ])
      ).toBe('Alice (lead), Bob');
    });

    it('formats legacy unresolved shape as count + lead count', () => {
      expect(
        formatHistoryFieldValue('commsContacts', [
          { userId: 1, isLead: true },
          { userId: 2, isLead: false },
        ])
      ).toBe('2 contact(s) (1 lead)');
    });

    it('omits lead count when no leads in legacy shape', () => {
      expect(
        formatHistoryFieldValue('commsContacts', [{ userId: 1, isLead: false }])
      ).toBe('1 contact(s)');
    });
  });

  // ── reportSettings ────────────────────────────────────────────────────────

  describe('reportSettings', () => {
    it('returns "(no reports)" for empty array', () => {
      expect(formatHistoryFieldValue('reportSettings', [])).toBe(
        '(no reports)'
      );
    });

    it('counts active and omitted reports', () => {
      expect(
        formatHistoryFieldValue('reportSettings', [
          { reportId: 1, omitted: false },
          { reportId: 2, omitted: true },
          { reportId: 3, omitted: false },
        ])
      ).toBe('2 active, 1 omitted');
    });
  });

  // ── generic fallbacks ─────────────────────────────────────────────────────

  describe('generic fallbacks', () => {
    it('returns string values as-is for unknown fields', () => {
      expect(formatHistoryFieldValue('title', 'Some title')).toBe('Some title');
    });

    it('returns number values as string for unknown fields', () => {
      expect(formatHistoryFieldValue('newsReleaseId', 42)).toBe('42');
    });

    it('returns count fallback for unrecognised arrays', () => {
      expect(formatHistoryFieldValue('unknownField', [1, 2, 3])).toBe(
        '3 item(s)'
      );
    });
  });
});
