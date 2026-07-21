import { describe, expect, it } from 'vitest';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import { EMPTY_RICH_TEXT_DOC } from '@corpcal/shared/utils';

import {
  buildMarkReviewedOnlyPayload,
  buildPayloadForCreate,
  buildPayloadForUpdate,
} from './activity-form-payload';

function minimalForm(
  overrides: Partial<ActivityFormData> = {}
): ActivityFormData {
  return {
    title: 'Test Activity',
    summary:
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Summary"}]}]}',
    dateStatusId: 1,
    timeStatusId: 1,
    isIssue: false,
    isAllDay: false,
    isConfidential: false,
    visibility: 'global',
    leadTeamId: 1,
    categoryIds: [1],
    commsContacts: [{ userId: 1, isLead: true }],
    ...overrides,
  };
}

describe('buildMarkReviewedOnlyPayload', () => {
  it('returns markAsReviewed true and optional notes', () => {
    expect(buildMarkReviewedOnlyPayload()).toEqual({ markAsReviewed: true });
    expect(buildMarkReviewedOnlyPayload('note')).toEqual({
      markAsReviewed: true,
      activityHistoryNotes: 'note',
    });
  });
});

describe('buildPayloadForCreate', () => {
  it('maps cleared lookAheadSection to null for API', () => {
    const formValues = minimalForm({ lookAheadSection: undefined });

    const payload = buildPayloadForCreate(formValues, formValues);

    expect(payload.lookAheadSection).toBeNull();
  });

  it('preserves lookAheadSection when a section is selected', () => {
    const formValues = minimalForm({ lookAheadSection: 'events' });

    const payload = buildPayloadForCreate(formValues, formValues);

    expect(payload.lookAheadSection).toBe('events');
  });

  it('strips UI sentinels from optional fields before sending to API', () => {
    const formValues = minimalForm({
      notes: '',
      significance: EMPTY_RICH_TEXT_DOC,
      executiveSummary: EMPTY_RICH_TEXT_DOC,
    });

    const payload = buildPayloadForCreate(formValues, formValues);

    expect(payload.notes).toBeNull();
    expect(payload.significance).toBeNull();
    expect(payload.executiveSummary).toBeNull();
    expect(payload.notes).not.toBe('');
    expect(payload.significance).not.toBe(EMPTY_RICH_TEXT_DOC);
  });

  it('strips orphan translationLanguageIds when status is not required', () => {
    const formValues = minimalForm({
      translationsRequiredStatusId: 1,
      translationLanguageIds: [1, 2],
    });

    const payload = buildPayloadForCreate(formValues, formValues, {
      requiredTranslationStatusId: 2,
    });

    expect(payload.translationLanguageIds).toBeUndefined();
  });
});

describe('buildPayloadForUpdate', () => {
  it('maps cleared lookAheadSection to null so PATCH clears the DB column', () => {
    const formValues = minimalForm({
      lookAheadSection: undefined,
    });

    const payload = buildPayloadForUpdate(formValues, formValues);

    expect(payload.lookAheadSection).toBeNull();
  });

  it('strips UI sentinels from optional fields before sending to API', () => {
    const formValues = minimalForm({
      notes: '',
      schedulingNotes: '',
      strategy: '',
      significance: EMPTY_RICH_TEXT_DOC,
    });

    const payload = buildPayloadForUpdate(formValues, formValues);

    expect(payload.notes).toBeNull();
    expect(payload.schedulingNotes).toBeNull();
    expect(payload.strategy).toBeNull();
    expect(payload.significance).toBeNull();
  });

  it('strips orphan translationLanguageIds when status is not required', () => {
    const formValues = minimalForm({
      translationsRequiredStatusId: 3,
      translationLanguageIds: [1],
    });

    const payload = buildPayloadForUpdate(formValues, formValues, {
      requiredTranslationStatusId: 2,
    });

    expect(payload.translationLanguageIds).toBeUndefined();
  });

  it('omits representatives when includeRepresentatives is false', () => {
    const formValues = minimalForm({ representatives: undefined });

    const payload = buildPayloadForUpdate(formValues, formValues, {
      includeRepresentatives: false,
    });

    expect(payload).not.toHaveProperty('representatives');
  });

  it('includes representatives as empty array when includeRepresentatives is true', () => {
    const formValues = minimalForm({ representatives: [] });

    const payload = buildPayloadForUpdate(formValues, formValues, {
      includeRepresentatives: true,
    });

    expect(payload.representatives).toEqual([]);
  });
});
