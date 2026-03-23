import { describe, expect, it } from 'vitest';

import type { ActivityFormData } from '../schemas/activity.schema';
import { canonicalizeActivityFormData } from './activity-form-canonicalize';
import { isDeepEqual } from './isDeepEqual';

function minimalForm(overrides: Partial<ActivityFormData>): ActivityFormData {
  return {
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
    ...overrides,
  } as ActivityFormData;
}

describe('canonicalizeActivityFormData', () => {
  it('treats notes empty string like undefined for deep equality', () => {
    const a = canonicalizeActivityFormData(minimalForm({ notes: undefined }));
    const b = canonicalizeActivityFormData(minimalForm({ notes: '' }));
    expect(isDeepEqual(a.notes, b.notes)).toBe(true);
  });

  it('treats sharedWithTeamIds undefined like empty array', () => {
    const a = canonicalizeActivityFormData(
      minimalForm({ sharedWithTeamIds: undefined })
    );
    const b = canonicalizeActivityFormData(
      minimalForm({ sharedWithTeamIds: [] })
    );
    expect(isDeepEqual(a.sharedWithTeamIds, b.sharedWithTeamIds)).toBe(true);
  });

  it('normalizes venueStatusId null to undefined (matches mapResponseToFormData / RHF reset)', () => {
    const a = canonicalizeActivityFormData(
      minimalForm({ venueStatusId: undefined })
    );
    const b = canonicalizeActivityFormData(
      minimalForm({
        venueStatusId: null as unknown as ActivityFormData['venueStatusId'],
      })
    );
    expect(a.venueStatusId).toBeUndefined();
    expect(b.venueStatusId).toBeUndefined();
  });

  it('aligns missing venueAddress with explicit all-null venue object', () => {
    const a = canonicalizeActivityFormData(minimalForm({}));
    const b = canonicalizeActivityFormData(
      minimalForm({
        venueAddress: {
          venueName: null,
          addressLine1: null,
          addressLine2: null,
          city: null,
          provinceOrState: null,
          country: null,
        },
      })
    );
    expect(isDeepEqual(a.venueAddress, b.venueAddress)).toBe(true);
  });

  it('stabilizes summary null, undefined, and empty string to the same value', () => {
    const withUndefined = canonicalizeActivityFormData(
      minimalForm({ summary: undefined })
    );
    const withNull = canonicalizeActivityFormData(
      minimalForm({
        summary: null as unknown as ActivityFormData['summary'],
      })
    );
    const withEmpty = canonicalizeActivityFormData(
      minimalForm({ summary: '' })
    );
    expect(withUndefined.summary).toBe('');
    expect(withNull.summary).toBe('');
    expect(withEmpty.summary).toBe('');
    expect(isDeepEqual(withUndefined.summary, withEmpty.summary)).toBe(true);
  });
});
