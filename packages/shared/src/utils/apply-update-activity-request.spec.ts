import { describe, expect, it } from 'vitest';

import type {
  ActivityFormData,
  UpdateActivityRequest,
} from '../schemas/activity.schema';
import { applyUpdateActivityRequestToFormData } from './apply-update-activity-request';

function baseForm(overrides: Partial<ActivityFormData> = {}): ActivityFormData {
  return {
    title: 'Original',
    summary: 'Original summary',
    dateStatusId: 1,
    timeStatusId: 1,
    isIssue: false,
    isAllDay: false,
    isConfidential: false,
    visibility: 'global',
    leadTeamId: 5,
    categoryIds: [1],
    sharedWithTeamIds: [],
    ...overrides,
  } as ActivityFormData;
}

describe('applyUpdateActivityRequestToFormData', () => {
  it('returns a new object without mutating the base', () => {
    const base = baseForm();
    const result = applyUpdateActivityRequestToFormData(base, {
      title: 'Updated',
    });
    expect(result).not.toBe(base);
    expect(base.title).toBe('Original');
    expect(result.title).toBe('Updated');
  });

  it('overrides only fields present in the DTO', () => {
    const base = baseForm({ title: 'Original', summary: 'Keep me' });
    const result = applyUpdateActivityRequestToFormData(base, {
      title: 'New',
    });
    expect(result.title).toBe('New');
    expect(result.summary).toBe('Keep me');
  });

  it('ignores undefined DTO values', () => {
    const base = baseForm({ title: 'Keep' });
    const result = applyUpdateActivityRequestToFormData(base, {
      title: undefined,
    } as UpdateActivityRequest);
    expect(result.title).toBe('Keep');
  });

  it('applies exempt-field changes (visibility, sharedWithTeamIds)', () => {
    const base = baseForm({ visibility: 'global', sharedWithTeamIds: [] });
    const result = applyUpdateActivityRequestToFormData(base, {
      visibility: 'team',
      sharedWithTeamIds: [10, 11],
    });
    expect(result.visibility).toBe('team');
    expect(result.sharedWithTeamIds).toEqual([10, 11]);
  });

  it('does not merge workflow-intent keys into the form shape', () => {
    const base = baseForm();
    const result = applyUpdateActivityRequestToFormData(base, {
      markAsReviewed: true,
      markAsCompleted: false,
    } as UpdateActivityRequest);
    expect(
      (result as unknown as Record<string, unknown>).markAsReviewed
    ).toBeUndefined();
    expect(
      (result as unknown as Record<string, unknown>).markAsCompleted
    ).toBeUndefined();
  });

  it('supports replacing arrays wholesale', () => {
    const base = baseForm({ categoryIds: [1, 2] });
    const result = applyUpdateActivityRequestToFormData(base, {
      categoryIds: [3],
    });
    expect(result.categoryIds).toEqual([3]);
  });
});
