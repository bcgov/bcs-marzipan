import { describe, expect, it } from 'vitest';

import type { ActivityFormData } from '../schemas/activity.schema';
import {
  buildReviewSnapshot,
  diffReviewFields,
  getEmptyReviewBaseline,
} from './activity-review-diff';

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

describe('getEmptyReviewBaseline', () => {
  it('returns a canonical empty form', () => {
    const baseline = getEmptyReviewBaseline();
    expect(baseline.title).toBe('');
    expect(baseline.summary).toBe('');
    expect(baseline.categoryIds).toEqual([]);
    expect(baseline.venueAddress).toEqual({
      venueName: null,
      addressLine1: null,
      addressLine2: null,
      city: null,
      provinceOrState: null,
      country: null,
    });
  });
});

describe('buildReviewSnapshot', () => {
  it('canonicalizes form data for storage', () => {
    const snap = buildReviewSnapshot(
      minimalForm({ notes: '', significance: '' })
    );
    expect(snap.notes).toBeUndefined();
    expect(snap.significance).toBeUndefined();
  });
});

describe('diffReviewFields', () => {
  it('returns empty array when current matches baseline', () => {
    const form = minimalForm({});
    const result = diffReviewFields(form, form);
    expect(result).toEqual([]);
  });

  it('detects scalar field changes', () => {
    const baseline = minimalForm({});
    const current = minimalForm({ title: 'New Title' });
    const result = diffReviewFields(current, baseline);
    expect(result).toContain('title');
  });

  it('does not flag reverted fields', () => {
    const baseline = minimalForm({ title: 'Original' });
    const current = minimalForm({ title: 'Original' });
    const result = diffReviewFields(current, baseline);
    expect(result).not.toContain('title');
  });

  it('detects ID array changes regardless of order', () => {
    const baseline = minimalForm({ tagIds: [1, 2, 3] });
    const current = minimalForm({ tagIds: [3, 1, 2] });
    expect(diffReviewFields(current, baseline)).not.toContain('tagIds');

    const different = minimalForm({ tagIds: [1, 2, 4] });
    expect(diffReviewFields(different, baseline)).toContain('tagIds');
  });

  it('detects venue address sub-field changes', () => {
    const baseline = minimalForm({
      venueAddress: {
        venueName: 'Place A',
        addressLine1: null,
        addressLine2: null,
        city: null,
        provinceOrState: null,
        country: null,
      },
    });
    const current = minimalForm({
      venueAddress: {
        venueName: 'Place A',
        addressLine1: null,
        addressLine2: null,
        city: 'Victoria',
        provinceOrState: null,
        country: null,
      },
    });
    const result = diffReviewFields(current, baseline);
    expect(result).toContain('venueAddress.city');
    expect(result).not.toContain('venueAddress.venueName');
  });

  it('detects object array changes (commsContacts)', () => {
    const baseline = minimalForm({
      commsContacts: [{ userId: 1, isLead: true }],
    });
    const current = minimalForm({
      commsContacts: [
        { userId: 1, isLead: true },
        { userId: 2, isLead: false },
      ],
    });
    expect(diffReviewFields(current, baseline)).toContain('commsContacts');
  });

  it('excludes system fields from diff', () => {
    const baseline = minimalForm({ activityStatusId: 1 });
    const current = minimalForm({ activityStatusId: 2 });
    expect(diffReviewFields(current, baseline)).not.toContain(
      'activityStatusId'
    );
  });

  it('empty baseline vs filled form flags all user fields', () => {
    const baseline = getEmptyReviewBaseline();
    const form = minimalForm({ title: 'Test', summary: 'Desc' });
    const result = diffReviewFields(form, baseline);
    expect(result).toContain('title');
    expect(result).toContain('summary');
    expect(result).toContain('categoryIds');
    expect(result).toContain('leadTeamId');
  });

  it('normalizes empty/null/undefined optional strings', () => {
    const baseline = minimalForm({ notes: '' });
    const current = minimalForm({ notes: undefined });
    expect(diffReviewFields(current, baseline)).not.toContain('notes');
  });
});
