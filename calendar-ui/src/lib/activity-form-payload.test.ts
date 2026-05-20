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
});

describe('buildPayloadForUpdate', () => {
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
});
