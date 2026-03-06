import { describe, expect, it } from 'vitest';

import type { ActivityResponse } from '@corpcal/shared/api/types';
import type { UpdateActivityRequest } from '@corpcal/shared/schemas';

import {
  buildOptimisticActivity,
  normalizeListParams,
} from './activity-query-utils';

describe('normalizeListParams', () => {
  it('returns empty object for no input', () => {
    expect(normalizeListParams()).toEqual({});
    expect(normalizeListParams({})).toEqual({});
  });

  it('includes only excludeCompleted when provided', () => {
    expect(normalizeListParams({ excludeCompleted: true })).toEqual({
      excludeCompleted: true,
    });
    expect(normalizeListParams({ excludeCompleted: false })).toEqual({
      excludeCompleted: false,
    });
  });

  it('includes only includeDeleted when provided', () => {
    expect(normalizeListParams({ includeDeleted: true })).toEqual({
      includeDeleted: true,
    });
    expect(normalizeListParams({ includeDeleted: false })).toEqual({
      includeDeleted: false,
    });
  });

  it('includes both keys when both provided', () => {
    expect(
      normalizeListParams({
        excludeCompleted: false,
        includeDeleted: true,
      })
    ).toEqual({ excludeCompleted: false, includeDeleted: true });
  });

  it('omits keys when value is undefined for stable query key', () => {
    expect(
      normalizeListParams({
        excludeCompleted: undefined,
        includeDeleted: undefined,
      })
    ).toEqual({});
  });

  it('copies only excludeCompleted and includeDeleted when params have extra keys', () => {
    const params = {
      excludeCompleted: true,
      includeDeleted: false,
      page: 1,
      limit: 20,
    } as Parameters<typeof normalizeListParams>[0];
    expect(normalizeListParams(params)).toEqual({
      excludeCompleted: true,
      includeDeleted: false,
    });
  });

  it('includes leadTeamId, commsContactLeadUserId, sharedWithTeamId, sharedWithTeamIds when provided', () => {
    expect(
      normalizeListParams({
        excludeCompleted: true,
        leadTeamId: 5,
      })
    ).toEqual({ excludeCompleted: true, leadTeamId: 5 });
    expect(
      normalizeListParams({
        commsContactLeadUserId: 10,
        sharedWithTeamId: 3,
      })
    ).toEqual({
      commsContactLeadUserId: 10,
      sharedWithTeamId: 3,
    });
    expect(
      normalizeListParams({
        sharedWithTeamIds: [3, 1, 2],
      })
    ).toEqual({ sharedWithTeamIds: [1, 2, 3] });
  });
});

describe('buildOptimisticActivity', () => {
  const minimalExisting = {
    id: 1,
    title: 'Original title',
    summary: 'Original summary',
    isConfidential: false,
    isIssue: false,
    isAllDay: true,
    startDate: '2025-01-01',
    endDate: '2025-01-02',
    startTime: null,
    endTime: null,
    lookAheadStatus: null,
    lookAheadSection: null,
    pitchDate: null,
    createdDateTime: '2025-01-01T00:00:00Z',
    lastUpdatedDateTime: '2025-01-01T00:00:00Z',
  } as ActivityResponse;

  it('merges one mergeable key from update into existing', () => {
    const update: UpdateActivityRequest = { title: 'Updated title' };
    const result = buildOptimisticActivity(minimalExisting, update);
    expect(result.title).toBe('Updated title');
    expect(result.summary).toBe('Original summary');
    expect(result.id).toBe(1);
  });

  it('merges multiple mergeable keys from update', () => {
    const update: UpdateActivityRequest = {
      title: 'New title',
      summary: 'New summary',
      isConfidential: true,
    };
    const result = buildOptimisticActivity(minimalExisting, update);
    expect(result.title).toBe('New title');
    expect(result.summary).toBe('New summary');
    expect(result.isConfidential).toBe(true);
    expect(result.isIssue).toBe(false);
    expect(result.id).toBe(1);
  });

  it('leaves existing value for keys not in update', () => {
    const update: UpdateActivityRequest = { title: 'Only title' };
    const result = buildOptimisticActivity(minimalExisting, update);
    expect(result.summary).toBe('Original summary');
    expect(result.startDate).toBe('2025-01-01');
    expect(result.createdDateTime).toBe('2025-01-01T00:00:00Z');
  });

  it('does not overwrite existing with non-mergeable keys from update', () => {
    const existingWithExtra = {
      ...minimalExisting,
      id: 42,
      leadOrgId: 10,
    } as ActivityResponse;
    const update = {
      id: 999,
      leadOrgId: 99,
      title: 'New title',
    } as UpdateActivityRequest;
    const result = buildOptimisticActivity(existingWithExtra, update);
    expect(result.title).toBe('New title');
    expect(result.id).toBe(42);
    expect(result.leadOrgId).toBe(10);
  });

  it('returns a copy of existing when update is empty', () => {
    const update: UpdateActivityRequest = {};
    const result = buildOptimisticActivity(minimalExisting, update);
    expect(result).toEqual(minimalExisting);
    expect(result).not.toBe(minimalExisting);
  });
});
