import { describe, expect, it } from 'vitest';

import { buildMarkReviewedOnlyPayload } from './activity-form-payload';

describe('buildMarkReviewedOnlyPayload', () => {
  it('returns markAsReviewed true and optional notes', () => {
    expect(buildMarkReviewedOnlyPayload()).toEqual({ markAsReviewed: true });
    expect(buildMarkReviewedOnlyPayload('note')).toEqual({
      markAsReviewed: true,
      activityHistoryNotes: 'note',
    });
  });
});
