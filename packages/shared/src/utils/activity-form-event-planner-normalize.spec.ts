import { describe, expect, it } from 'vitest';

import { canonicalizeActivityFormData } from './activity-form-canonicalize';
import {
  normalizeEventPlannerFormEntries,
  normalizeEventPlannerFormEntry,
} from './activity-form-event-planner-normalize';
import { isDeepEqual } from './isDeepEqual';

describe('normalizeEventPlannerFormEntry', () => {
  it('keeps id-based planners without redundant name keys', () => {
    expect(
      normalizeEventPlannerFormEntry({
        eventPlannerId: 5,
        eventPlannerName: 'Lookup Name',
        isLead: true,
      })
    ).toEqual({ eventPlannerId: 5, isLead: true });
  });

  it('keeps freeform planners by name', () => {
    expect(
      normalizeEventPlannerFormEntry({
        eventPlannerName: ' External Lead ',
        isLead: true,
      })
    ).toEqual({ eventPlannerName: 'External Lead', isLead: true });
  });
});

describe('normalizeEventPlannerFormEntries', () => {
  it('matches combobox round-trip shape for lookup planners', () => {
    const hydrated = normalizeEventPlannerFormEntries([
      {
        eventPlannerId: 5,
        eventPlannerName: undefined,
        isLead: true,
      },
    ]);
    const comboboxRoundTrip = normalizeEventPlannerFormEntries([
      { eventPlannerId: 5, isLead: true },
    ]);
    expect(isDeepEqual(hydrated, comboboxRoundTrip)).toBe(true);
  });
});

describe('canonicalizeActivityFormData eventPlanners', () => {
  it('normalizes redundant planner keys during canonicalize', () => {
    const canon = canonicalizeActivityFormData({
      title: 'T',
      summary: 'S',
      dateStatusId: 1,
      timeStatusId: 1,
      isIssue: false,
      isAllDay: false,
      isConfidential: false,
      visibility: 'global',
      leadTeamId: 1,
      categoryIds: [1],
      eventPlanners: [
        {
          eventPlannerId: 5,
          eventPlannerName: 'Lookup Name',
          isLead: true,
        },
      ],
    });

    expect(canon.eventPlanners).toEqual([{ eventPlannerId: 5, isLead: true }]);
  });
});
