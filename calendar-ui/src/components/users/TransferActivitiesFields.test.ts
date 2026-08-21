import { describe, expect, it } from 'vitest';

import type { UserActivityItem } from '@/api/usersApi';
import {
  buildRemoveUserFromTeamBody,
  buildTransferActivitiesBody,
  createInitialTransferDraft,
  isTransferActivitiesDraftPristine,
  isTransferActivitiesDraftValid,
  wouldTransferDraftHaveEffect,
} from '@/components/users/TransferActivitiesFields';

const scopedActivities: UserActivityItem[] = [
  { id: 10, label: 'Alpha', value: 10, isLead: true },
  { id: 11, label: 'Beta', value: 11, isLead: false },
];

describe('buildTransferActivitiesBody', () => {
  it('omits activityIds when every scoped activity is selected', () => {
    const draft = {
      ...createInitialTransferDraft(1),
      targetUserId: 2,
      selectedActivityIds: [10, 11],
      includeNonLead: false,
    };
    const body = buildTransferActivitiesBody(draft, [10, 11]);
    expect(body.activityIds).toBeUndefined();
    expect(body.fromTeamId).toBe(1);
    expect(body.targetUserId).toBe(2);
  });

  it('sends a partial activityIds list when subset selected', () => {
    const draft = {
      ...createInitialTransferDraft(1),
      targetUserId: 2,
      selectedActivityIds: [10],
      includeNonLead: true,
    };
    const body = buildTransferActivitiesBody(draft, [10, 11]);
    expect(body.activityIds).toEqual([10]);
  });

  it('throws when no activities are selected', () => {
    const draft = {
      ...createInitialTransferDraft(1),
      targetUserId: 2,
      selectedActivityIds: [],
      includeNonLead: false,
    };
    expect(() => buildTransferActivitiesBody(draft, [10, 11])).toThrow(
      /at least one activity/i
    );
  });
});

describe('isTransferActivitiesDraftValid', () => {
  it('allows removal flow when there are no scoped activities', () => {
    expect(
      isTransferActivitiesDraftValid(createInitialTransferDraft(1), 1, false)
    ).toBe(true);
  });

  it('requires target user and selection when activities exist', () => {
    const draft = {
      ...createInitialTransferDraft(1),
      selectedActivityIds: [10],
      includeNonLead: false,
    };
    expect(isTransferActivitiesDraftValid(draft, 1, true)).toBe(false);
    expect(
      isTransferActivitiesDraftValid({ ...draft, targetUserId: 2 }, 1, true)
    ).toBe(true);
  });
});

describe('isTransferActivitiesDraftPristine', () => {
  it('is pristine after default load selection', () => {
    const draft = {
      ...createInitialTransferDraft(2),
      selectedActivityIds: [10, 11],
      includeNonLead: false,
    };
    expect(isTransferActivitiesDraftPristine(draft, [10, 11])).toBe(true);
  });

  it('is not pristine when notes were added', () => {
    const draft = {
      ...createInitialTransferDraft(2),
      selectedActivityIds: [10, 11],
      notes: 'handover',
    };
    expect(isTransferActivitiesDraftPristine(draft, [10, 11])).toBe(false);
  });
});

describe('wouldTransferDraftHaveEffect', () => {
  it('is false for non-lead-only selection without includeNonLead on same team', () => {
    const draft = {
      ...createInitialTransferDraft(1),
      targetUserId: 2,
      selectedActivityIds: [11],
      includeNonLead: false,
    };
    expect(wouldTransferDraftHaveEffect(draft, scopedActivities)).toBe(false);
  });

  it('is true when a lead activity is selected', () => {
    const draft = {
      ...createInitialTransferDraft(1),
      targetUserId: 2,
      selectedActivityIds: [10],
      includeNonLead: false,
    };
    expect(wouldTransferDraftHaveEffect(draft, scopedActivities)).toBe(true);
  });

  it('is true for cross-team transfer even when only non-lead is selected', () => {
    const draft = {
      ...createInitialTransferDraft(1),
      toTeamId: 3,
      targetUserId: 2,
      selectedActivityIds: [11],
      includeNonLead: false,
    };
    expect(wouldTransferDraftHaveEffect(draft, scopedActivities)).toBe(true);
  });
});

describe('buildRemoveUserFromTeamBody', () => {
  it('returns undefined when there are no scoped activities', () => {
    expect(
      buildRemoveUserFromTeamBody(createInitialTransferDraft(1), false)
    ).toBe(undefined);
  });

  it('builds body when comms assignments must transfer on removal', () => {
    const draft = {
      ...createInitialTransferDraft(1),
      targetUserId: 5,
      includeNonLead: true,
    };
    expect(buildRemoveUserFromTeamBody(draft, true)).toEqual({
      targetUserId: 5,
      includeNonLead: true,
    });
  });
});
