import { describe, expect, it } from 'vitest';

import type { ActivityFormData } from '../schemas/activity.schema';
import {
  canonicalizeActivityFormData,
  prepareActivityFormDataForSubmit,
} from './activity-form-canonicalize';
import { EMPTY_RICH_TEXT_DOC } from './activity-rich-text';
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
  };
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
        venueStatusId: null,
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

  it('drops non-object entries from representatives when canonicalizing', () => {
    const dirty = canonicalizeActivityFormData(
      minimalForm({
        representatives: [
          { representativeId: 1 },
          null,
          'x',
          1,
        ] as unknown as ActivityFormData['representatives'],
      })
    );
    expect(dirty.representatives).toEqual([{ representativeId: 1 }]);
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
    expect(withUndefined.summary).toBe(EMPTY_RICH_TEXT_DOC);
    expect(withNull.summary).toBe(EMPTY_RICH_TEXT_DOC);
    expect(withEmpty.summary).toBe(EMPTY_RICH_TEXT_DOC);
    expect(isDeepEqual(withUndefined.summary, withEmpty.summary)).toBe(true);
  });
});

describe('prepareActivityFormDataForSubmit', () => {
  it('maps UI sentinels on optional fields to null for API payloads', () => {
    const prepared = prepareActivityFormDataForSubmit(
      minimalForm({
        notes: '',
        schedulingNotes: '',
        strategy: '',
        significance: EMPTY_RICH_TEXT_DOC,
        executiveSummary: EMPTY_RICH_TEXT_DOC,
      })
    );

    expect(prepared.notes).toBeNull();
    expect(prepared.schedulingNotes).toBeNull();
    expect(prepared.strategy).toBeNull();
    expect(prepared.significance).toBeNull();
    expect(prepared.executiveSummary).toBeNull();
  });

  it('preserves non-empty optional field values', () => {
    const prepared = prepareActivityFormDataForSubmit(
      minimalForm({
        notes: 'Internal note',
        significance:
          '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Why it matters"}]}]}',
      })
    );

    expect(prepared.notes).toBe('Internal note');
    expect(prepared.significance).toContain('Why it matters');
  });
});
