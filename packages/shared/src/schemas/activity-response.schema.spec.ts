import { describe, expect, it } from 'vitest';

import {
  DEFAULT_VISIBILITY,
  LOOK_AHEAD_STATUS,
  VISIBILITY,
} from '../constants/constants';
import { createMockActivityResponse } from '../test-utils';
import { activityResponseSchema } from './activity-response.schema';

describe('activityResponseSchema', () => {
  it('accepts minimal valid response', () => {
    const result = activityResponseSchema.parse(createMockActivityResponse());
    expect(result.id).toBe(1);
    expect(result.visibility).toBe(DEFAULT_VISIBILITY);
  });

  it('accepts valid lookAheadStatus enums', () => {
    for (const s of LOOK_AHEAD_STATUS) {
      activityResponseSchema.parse(
        createMockActivityResponse({ lookAheadStatus: s })
      );
    }
  });

  it('accepts admin-defined lookAheadSection bucket keys', () => {
    for (const key of ['events', 'issues', 'longTerm', 'awareness']) {
      activityResponseSchema.parse(
        createMockActivityResponse({ lookAheadSection: key })
      );
    }
  });

  it('accepts valid visibility enums', () => {
    for (const v of VISIBILITY) {
      activityResponseSchema.parse(
        createMockActivityResponse({ visibility: v })
      );
    }
  });

  it('rejects invalid lookAheadStatus', () => {
    expect(() =>
      activityResponseSchema.parse(
        // @ts-expect-error Testing invalid value
        createMockActivityResponse({ lookAheadStatus: 'invalid' })
      )
    ).toThrow();
  });

  it('rejects invalid visibility', () => {
    expect(() =>
      activityResponseSchema.parse(
        // @ts-expect-error Testing invalid value
        createMockActivityResponse({ visibility: 'invalid' })
      )
    ).toThrow();
  });

  it('accepts optional nulls for nullable fields', () => {
    activityResponseSchema.parse(
      createMockActivityResponse({
        lookAheadStatus: null,
        lookAheadSection: null,
        leadOrgId: null,
      })
    );
  });

  it('accepts representativesAttending as string array', () => {
    const result = activityResponseSchema.parse(
      createMockActivityResponse({
        representativesAttending: ['Minister Smith', 'MLA Jones'],
      })
    );
    expect(result.representativesAttending).toEqual([
      'Minister Smith',
      'MLA Jones',
    ]);
  });
});
