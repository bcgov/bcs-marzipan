import { describe, expect, it } from 'vitest';

import type { ActivityTableRow } from './activityTableRow';
import { compareActivityRowsByLevels } from './activityTableSort';

const mockRow = (overrides: Partial<ActivityTableRow>): ActivityTableRow => ({
  id: 1,
  displayId: 'TEST-001',
  title: 'Test Activity',
  activityCategories: [],
  categoryIds: [],
  pitchDate: null,
  pitchRequiredStatus: null,
  isConfidential: false,
  isIssue: false,
  summary: '',
  executiveSummary: '',
  tags: [],
  lookAheadStatus: 'None',
  lookAheadSection: null,
  allDay: false,
  startDate: null,
  endDate: null,
  dateStatus: 'Unconfirmed',
  startTime: null,
  endTime: null,
  timeStatus: 'Unconfirmed',
  venue: null,
  premierRequested: null,
  activityRepresentatives: [],
  leadOrg: null,
  leadMinistry: null,
  leadMinistryAbbreviation: null,
  commsLeadName: null,
  commsContactsCount: 0,
  eventPlanners: [],
  eventPlannerLeadIds: [],
  leadTeamId: 1,
  leadMinistryId: null,
  leadOrgId: null,
  commsContactLeadUserId: null,
  translationsRequired: [],
  translationsRequiredStatus: null,
  translationsRequiredStatusId: null,
  commsMaterials: [],
  activityStatus: 'Reviewed',
  activityStatusId: 2,
  lastUpdatedDateTime: new Date().toISOString(),
  lastUpdatedBy: 1,
  createdDateTime: new Date().toISOString(),
  flags: [],
  ...overrides,
});

describe('activityTableSort', () => {
  describe('byStartDate', () => {
    it('sorts activities with dates before those without dates (ascending)', () => {
      const withDate = mockRow({ id: 1, startDate: '2025-02-01' });
      const withoutDate = mockRow({ id: 2, startDate: null });

      const result = compareActivityRowsByLevels(withDate, withoutDate, [
        { key: 'startDate', direction: 'asc' },
      ]);

      expect(result).toBeLessThan(0); // withDate should come first
    });

    it('sorts activities with dates before those without dates (descending)', () => {
      const withDate = mockRow({ id: 1, startDate: '2025-02-01' });
      const withoutDate = mockRow({ id: 2, startDate: null });

      const result = compareActivityRowsByLevels(withDate, withoutDate, [
        { key: 'startDate', direction: 'desc' },
      ]);

      expect(result).toBeLessThan(0); // withDate should come first (before withoutDate)
    });

    it('sorts activities with no date to the end when both are null', () => {
      const a = mockRow({ id: 1, startDate: null });
      const b = mockRow({ id: 2, startDate: null });

      const result = compareActivityRowsByLevels(a, b, [
        { key: 'startDate', direction: 'asc' },
      ]);

      expect(result).toBe(0); // Equal; both have no date
    });

    it('sorts by earliest date ascending', () => {
      const earlier = mockRow({ id: 1, startDate: '2025-01-01' });
      const later = mockRow({ id: 2, startDate: '2025-02-01' });

      const result = compareActivityRowsByLevels(earlier, later, [
        { key: 'startDate', direction: 'asc' },
      ]);

      expect(result).toBeLessThan(0); // earlier should come first
    });

    it('sorts by latest date descending', () => {
      const earlier = mockRow({ id: 1, startDate: '2025-01-01' });
      const later = mockRow({ id: 2, startDate: '2025-02-01' });

      const result = compareActivityRowsByLevels(later, earlier, [
        { key: 'startDate', direction: 'desc' },
      ]);

      expect(result).toBeLessThan(0); // later should come first when descending
    });
  });
});
