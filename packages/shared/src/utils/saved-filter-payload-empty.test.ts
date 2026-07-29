import { describe, expect, it } from 'vitest';

import { savedFilterPayloadIsEmpty } from './saved-filter-payload-empty';

describe('savedFilterPayloadIsEmpty', () => {
  it('returns true for undefined filter state and blank search', () => {
    expect(savedFilterPayloadIsEmpty(undefined, '')).toBe(true);
    expect(savedFilterPayloadIsEmpty(undefined, undefined)).toBe(true);
  });

  it('returns false when search keyword has non-whitespace', () => {
    expect(savedFilterPayloadIsEmpty({}, '  hello  ')).toBe(false);
  });

  it('returns false when category IDs present', () => {
    expect(savedFilterPayloadIsEmpty({ categoryIds: [1] }, '')).toBe(false);
  });

  it('returns false for pitch not_scheduled', () => {
    expect(
      savedFilterPayloadIsEmpty(
        { pitchDateFilter: { kind: 'not_scheduled' } },
        ''
      )
    ).toBe(false);
  });

  it('returns false for pitch scheduled even with empty date range', () => {
    expect(
      savedFilterPayloadIsEmpty(
        {
          pitchDateFilter: {
            kind: 'scheduled',
            dateRange: {
              startDate: '',
              endDate: '',
              noStartDate: false,
              noEndDate: false,
            },
          },
        },
        ''
      )
    ).toBe(false);
  });

  it('returns false for date range with start', () => {
    expect(
      savedFilterPayloadIsEmpty(
        { dateRange: { startDate: '2025-01-01', endDate: '' } },
        ''
      )
    ).toBe(false);
  });

  it('returns true for default-shaped empty object', () => {
    expect(
      savedFilterPayloadIsEmpty(
        {
          dateRange: {
            startDate: '',
            endDate: '',
            noStartDate: false,
            noEndDate: false,
          },
          categoryIds: [],
          activityStatusIds: [],
          pitchRequiredStatusNames: [],
          pitchDateFilter: { kind: 'any' },
          lookAheadStatusValues: [],
          lookAheadSectionValues: [],
          dateConfirmedFilter: 'any',
          timeConfirmedFilter: 'any',
          tagIds: [],
          leadMinistryIds: [],
          leadOrgIds: [],
          commsContactLeadUserIds: [],
          eventPlannerLeadIds: [],
          translationRequiredStatusIds: [],
          translationLanguageIds: [],
        },
        ''
      )
    ).toBe(true);
  });

  it('returns false when payload has unknown keys even if values look empty', () => {
    expect(
      savedFilterPayloadIsEmpty(
        {
          dateRange: {
            startDate: '',
            endDate: '',
            noStartDate: false,
            noEndDate: false,
          },
          categoryIds: [],
          activityStatusIds: [],
          pitchRequiredStatusNames: [],
          pitchDateFilter: { kind: 'any' },
          lookAheadStatusValues: [],
          lookAheadSectionValues: [],
          dateConfirmedFilter: 'any',
          timeConfirmedFilter: 'any',
          tagIds: [],
          leadMinistryIds: [],
          leadOrgIds: [],
          commsContactLeadUserIds: [],
          eventPlannerLeadIds: [],
          translationRequiredStatusIds: [],
          translationLanguageIds: [],
          extraKey: true,
        },
        ''
      )
    ).toBe(false);
  });
});
