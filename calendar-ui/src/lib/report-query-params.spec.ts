import { describe, expect, it } from 'vitest';

import { stableSerializeReportQueryParams } from './report-query-params';

describe('stableSerializeReportQueryParams', () => {
  it('produces the same key regardless of array element order', () => {
    const a = stableSerializeReportQueryParams({
      tagIds: [3, 1, 2],
      categoryIds: [3, 1],
    });
    const b = stableSerializeReportQueryParams({
      tagIds: [1, 2, 3],
      categoryIds: [1, 3],
    });
    expect(a).toBe(b);
  });

  it('sorts object keys and omits undefined values', () => {
    expect(
      stableSerializeReportQueryParams({
        includeCompleted: true,
        tagIds: [2, 1],
        leadTeamIds: undefined,
      })
    ).toBe('{"includeCompleted":true,"tagIds":[1,2]}');
  });
});
