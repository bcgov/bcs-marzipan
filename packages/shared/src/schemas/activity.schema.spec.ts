import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LOOK_AHEAD_SECTION,
  DEFAULT_LOOK_AHEAD_STATUS,
  VISIBILITY,
} from '../constants/constants';
import {
  createActivityRequestSchema,
  updateActivityRequestSchema,
  venueAddressFieldsSchema,
} from './activity.schema';

const validLeadMinistryId = '550e8400-e29b-41d4-a716-446655440000';

function minimalCreateRequest(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Test Activity',
    summary: 'Summary',
    significance: 'Significance',
    dateStatusId: 1,
    timeStatusId: 1,
    activityStatusId: 1,
    leadMinistryId: validLeadMinistryId,
    ...overrides,
  };
}

describe('createActivityRequestSchema', () => {
  it('accepts minimal valid request', () => {
    const result = createActivityRequestSchema.parse(minimalCreateRequest());
    expect(result.title).toBe('Test Activity');
    expect(result.leadMinistryId).toBe(validLeadMinistryId);
  });

  it('enforces title min 1 and max 255', () => {
    createActivityRequestSchema.parse(minimalCreateRequest({ title: 'x' }));
    expect(() =>
      createActivityRequestSchema.parse(minimalCreateRequest({ title: '' }))
    ).toThrow();
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ title: 'a'.repeat(256) })
      )
    ).toThrow();
  });

  it('enforces summary max 1000 and significance max 1000', () => {
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ summary: 'a'.repeat(1001) })
      )
    ).toThrow();
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ significance: 'a'.repeat(1001) })
      )
    ).toThrow();
  });

  it('accepts valid enums for visibility, lookAheadStatus, lookAheadSection', () => {
    for (const v of VISIBILITY) {
      createActivityRequestSchema.parse(
        minimalCreateRequest({ visibility: v })
      );
    }
    createActivityRequestSchema.parse(
      minimalCreateRequest({
        lookAheadStatus: DEFAULT_LOOK_AHEAD_STATUS,
        lookAheadSection: DEFAULT_LOOK_AHEAD_SECTION,
      })
    );
  });

  it('rejects invalid visibility', () => {
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ visibility: 'invalid' })
      )
    ).toThrow();
  });

  it('accepts venueAddress as nullable/optional', () => {
    createActivityRequestSchema.parse(
      minimalCreateRequest({ venueAddress: null })
    );
    createActivityRequestSchema.parse(minimalCreateRequest());
    createActivityRequestSchema.parse(
      minimalCreateRequest({
        venueAddress: {
          venueName: 'Hall',
          street: null,
          city: null,
          provinceOrState: null,
          country: null,
        },
      })
    );
  });

  it('transforms empty string to null for leadOrgId (emptyStringToNull)', () => {
    const result = createActivityRequestSchema.parse(
      minimalCreateRequest({ leadOrgId: '' })
    );
    expect(result.leadOrgId).toBeNull();
  });

  it('validates leadMinistryId as UUID', () => {
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ leadMinistryId: 'not-a-uuid' })
      )
    ).toThrow();
  });
});

describe('updateActivityRequestSchema', () => {
  it('accepts partial update with only some fields', () => {
    const result = updateActivityRequestSchema.parse({ title: 'Updated' });
    expect(result.title).toBe('Updated');
  });

  it('accepts empty object', () => {
    updateActivityRequestSchema.parse({});
  });
});

describe('venueAddressFieldsSchema', () => {
  it('accepts null', () => {
    expect(venueAddressFieldsSchema.parse(null)).toBeNull();
  });

  it('accepts undefined (optional)', () => {
    expect(venueAddressFieldsSchema.parse(undefined)).toBeUndefined();
  });

  it('accepts valid venue object with nullables', () => {
    const v = {
      venueName: 'Hall',
      street: null,
      city: 'Victoria',
      provinceOrState: null,
      country: 'Canada',
    };
    expect(venueAddressFieldsSchema.parse(v)).toEqual(v);
  });
});
