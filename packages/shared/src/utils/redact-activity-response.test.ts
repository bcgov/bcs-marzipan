import { describe, expect, it } from 'vitest';

import { SYSTEM_ROLES } from '../auth/constants';
import { createMockActivityListItem } from '../test-utils/activity-list-item.fixture';
import { createMockActivityResponse } from '../test-utils/activity-response.fixture';
import {
  isActivityResponsePayload,
  redactActivityResponse,
} from './redact-activity-response';

const advancedViewer = {
  permissions: ['activities.view'],
  roleName: SYSTEM_ROLES.ADVANCED_VIEWER,
};
const viewerNoGrants = {
  permissions: ['activities.view'],
  roleName: SYSTEM_ROLES.VIEWER,
};
const editorWithAllViewGrants = {
  permissions: [
    'activities.view',
    'activities.notes.view',
    'activities.lookAhead.view',
    'activities.pitchStatus.view',
  ],
  roleName: SYSTEM_ROLES.EDITOR,
};

describe('isActivityResponsePayload', () => {
  it('returns true for a full activity-shaped object', () => {
    const activity = createMockActivityResponse();
    expect(isActivityResponsePayload(activity)).toBe(true);
  });

  it('returns false for list/report activity rows', () => {
    expect(isActivityResponsePayload(createMockActivityListItem())).toBe(false);
  });

  it('returns false for category lookup rows', () => {
    expect(
      isActivityResponsePayload({
        id: 1,
        name: 'event',
        displayName: 'Event',
        sortOrder: 0,
        visibility: 'global',
        isActive: true,
      })
    ).toBe(false);
  });

  it('returns false for activity history entries', () => {
    expect(
      isActivityResponsePayload({
        id: 1,
        activityId: 2,
        userId: 3,
        actionType: 'note_added',
        changes: null,
        notes: 'hi',
        timestamp: '2025-01-01T00:00:00.000Z',
      })
    ).toBe(false);
  });

  it('returns false for global-history activity summary (no activityStatusId / isIssue)', () => {
    expect(
      isActivityResponsePayload({
        id: 1,
        displayId: 'A-1',
        title: 'T',
        leadTeamId: 1,
        categories: [],
      })
    ).toBe(false);
  });

  it('returns false for null and non-objects', () => {
    expect(isActivityResponsePayload(null)).toBe(false);
    expect(isActivityResponsePayload(undefined)).toBe(false);
    expect(isActivityResponsePayload('x')).toBe(false);
  });
});

describe('redactActivityResponse', () => {
  const activity = createMockActivityResponse({
    notes: 'secret notes',
    dateStatusId: 2,
    timeStatusId: 3,
    dateStatus: 'Set',
    timeStatus: 'Tentative',
    lookAheadStatus: 'new',
    lookAheadSection: 'events',
    translationsRequired: ['French'],
    translationsRequiredStatusId: 1,
    translationsRequiredStatus: 'Pending',
    pitchRequiredStatusId: 2,
    pitchRequiredStatus: 'Required',
    pitchDate: '2025-03-01',
  });

  it('returns all fields when user has all view grants for restricted scopes', () => {
    const result = redactActivityResponse(activity, editorWithAllViewGrants);
    expect(result.notes).toBe('secret notes');
    expect(result.dateStatusId).toBe(2);
    expect(result.timeStatusId).toBe(3);
    expect(result.lookAheadStatus).toBe('new');
    expect(result.translationsRequired).toEqual(['French']);
    expect(result.pitchDate).toBe('2025-03-01');
  });

  it('strips pitch status but keeps pitch date when pitch status is not viewable', () => {
    const viewerNoPitchStatus = {
      permissions: [
        'activities.view',
        'activities.notes.view',
        'activities.lookAhead.view',
      ],
      roleName: SYSTEM_ROLES.EDITOR,
    };
    const result = redactActivityResponse(activity, viewerNoPitchStatus);
    expect(result.pitchRequiredStatusId).toBeUndefined();
    expect(result.pitchRequiredStatus).toBeUndefined();
    expect(result.pitchDate).toBe('2025-03-01');
  });

  it('strips view-restricted fields for Viewer without grants; keeps date/time status, translations, and pitch date', () => {
    const result = redactActivityResponse(activity, viewerNoGrants);
    expect(result.notes).toBeUndefined();
    expect(result.dateStatusId).toBe(2);
    expect(result.timeStatusId).toBe(3);
    expect(result.dateStatus).toBe('Set');
    expect(result.timeStatus).toBe('Tentative');
    expect(result.lookAheadStatus).toBeUndefined();
    expect(result.lookAheadSection).toBeUndefined();
    expect(result.translationsRequired).toEqual(['French']);
    expect(result.translationsRequiredStatusId).toBe(1);
    expect(result.translationsRequiredStatus).toBe('Pending');
    expect(result.pitchRequiredStatusId).toBeUndefined();
    expect(result.pitchRequiredStatus).toBeUndefined();
    expect(result.pitchDate).toBe('2025-03-01');
  });

  it('preserves all fields for Advanced Viewer (role bypass)', () => {
    const result = redactActivityResponse(activity, advancedViewer);
    expect(result.notes).toBe('secret notes');
    expect(result.dateStatusId).toBe(2);
    expect(result.lookAheadStatus).toBe('new');
    expect(result.translationsRequired).toEqual(['French']);
    expect(result.pitchDate).toBe('2025-03-01');
  });

  it('does not mutate the original', () => {
    const original = createMockActivityResponse({ notes: 'keep' });
    redactActivityResponse(original, viewerNoGrants);
    expect(original.notes).toBe('keep');
  });

  it('preserves non-restricted fields', () => {
    const result = redactActivityResponse(activity, viewerNoGrants);
    expect(result.title).toBe('Test Activity');
    expect(result.summary).toBe('Test summary');
    expect(result.startDate).toBe('2025-01-15');
  });

  it('filters changedFieldsSinceReview for redacted view-restricted scopes only', () => {
    const withChanges = createMockActivityResponse({
      changedFieldsSinceReview: [
        'notes',
        'title',
        'dateStatusId',
        'lookAheadStatus',
      ],
    });
    const result = redactActivityResponse(withChanges, viewerNoGrants);
    expect(result.changedFieldsSinceReview).toEqual(['title', 'dateStatusId']);
  });
});
