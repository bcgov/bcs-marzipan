import { describe, expect, it } from 'vitest';

import {
  filterActivitiesQuerySchema,
  lookupQueryParamsSchema,
} from './query-params.schema';

describe('lookupQueryParamsSchema', () => {
  it('accepts valid empty input', () => {
    const result = lookupQueryParamsSchema.parse({});
    expect(result).toEqual({});
  });

  it('parses userId as integer', () => {
    expect(lookupQueryParamsSchema.parse({ userId: '42' })).toEqual({
      userId: 42,
    });
  });

  it('accepts role as string', () => {
    expect(lookupQueryParamsSchema.parse({ role: 'admin' })).toEqual({
      role: 'admin',
    });
  });

  it('parses organizationId as integer', () => {
    expect(lookupQueryParamsSchema.parse({ organizationId: '5' })).toEqual({
      organizationId: 5,
    });
  });

  it('rejects invalid organizationId (non-integer)', () => {
    expect(() =>
      lookupQueryParamsSchema.parse({ organizationId: 'not-a-number' })
    ).toThrow();
  });

  it('parses userIds as comma-separated string to array of ints', () => {
    expect(lookupQueryParamsSchema.parse({ userIds: '1,2,3' })).toEqual({
      userIds: [1, 2, 3],
    });
  });

  it('parses userIds string with spaces and filters NaN', () => {
    const result = lookupQueryParamsSchema.parse({ userIds: '1, 2, x, 4' });
    expect(result.userIds).toEqual([1, 2, 4]);
  });

  it('accepts userIds as array of string ints', () => {
    expect(lookupQueryParamsSchema.parse({ userIds: ['1', '2', '3'] })).toEqual(
      {
        userIds: [1, 2, 3],
      }
    );
  });

  it('rejects userId non-integer', () => {
    expect(() => lookupQueryParamsSchema.parse({ userId: 'x' })).toThrow();
  });

  it('rejects userId non-integer (float string)', () => {
    expect(() => lookupQueryParamsSchema.parse({ userId: '1.5' })).toThrow();
  });
});

describe('filterActivitiesQuerySchema', () => {
  it('applies defaults for page and limit when omitted', () => {
    const result = filterActivitiesQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('parses page and limit as positive ints', () => {
    const result = filterActivitiesQuerySchema.parse({
      page: '2',
      limit: '50',
    });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
  });

  it('accepts valid optional fields', () => {
    const result = filterActivitiesQuerySchema.parse({
      title: 'Test',
      startDateFrom: '2025-01-01',
      startDateTo: '2025-12-31',
      activityStatusId: '1',
      leadMinistryId: '2',
      city: 'Victoria',
      isIssue: 'true',
    });
    expect(result.title).toBe('Test');
    expect(result.startDateFrom).toBe('2025-01-01');
    expect(result.startDateTo).toBe('2025-12-31');
    expect(result.activityStatusId).toBe(1);
    expect(result.leadMinistryId).toBe(2);
    expect(result.city).toBe('Victoria');
    expect(result.isIssue).toBe(true);
  });

  it('transforms isIssue "true" to true', () => {
    expect(filterActivitiesQuerySchema.parse({ isIssue: 'true' }).isIssue).toBe(
      true
    );
  });

  it('transforms isIssue "false" to false', () => {
    expect(
      filterActivitiesQuerySchema.parse({ isIssue: 'false' }).isIssue
    ).toBe(false);
  });

  it('rejects invalid date for startDateFrom', () => {
    expect(() =>
      filterActivitiesQuerySchema.parse({ startDateFrom: '2025-13-45' })
    ).toThrow();
  });

  it('rejects invalid leadMinistryId (non-integer)', () => {
    expect(() =>
      filterActivitiesQuerySchema.parse({ leadMinistryId: 'not-a-number' })
    ).toThrow();
  });

  it('rejects non-integer activityStatusId', () => {
    expect(() =>
      filterActivitiesQuerySchema.parse({ activityStatusId: 'x' })
    ).toThrow();
  });

  it('rejects page less than 1', () => {
    expect(() => filterActivitiesQuerySchema.parse({ page: '0' })).toThrow();
  });

  it('rejects limit greater than 100', () => {
    expect(() => filterActivitiesQuerySchema.parse({ limit: '101' })).toThrow();
  });

  it('accepts limit 1 and 100', () => {
    expect(filterActivitiesQuerySchema.parse({ limit: '1' }).limit).toBe(1);
    expect(filterActivitiesQuerySchema.parse({ limit: '100' }).limit).toBe(100);
  });

  it('omits excludeCompleted and includeDeleted when not sent', () => {
    const result = filterActivitiesQuerySchema.parse({});
    expect(result.excludeCompleted).toBeUndefined();
    expect(result.includeDeleted).toBeUndefined();
  });

  it('parses excludeCompleted and includeDeleted from query strings', () => {
    expect(
      filterActivitiesQuerySchema.parse({ excludeCompleted: 'true' })
        .excludeCompleted
    ).toBe(true);
    expect(
      filterActivitiesQuerySchema.parse({ excludeCompleted: 'false' })
        .excludeCompleted
    ).toBe(false);
    expect(
      filterActivitiesQuerySchema.parse({ includeDeleted: 'true' })
        .includeDeleted
    ).toBe(true);
    expect(
      filterActivitiesQuerySchema.parse({ includeDeleted: 'false' })
        .includeDeleted
    ).toBe(false);
  });
});
