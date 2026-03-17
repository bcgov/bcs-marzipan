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

const validLeadTeamId = 1;
const validLeadMinistryId = 1;

/** Minimal valid create request; includes required commsContacts with one lead. */
function minimalCreateRequest(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Test Activity',
    summary: 'Summary',
    significance: 'Significance',
    dateStatusId: 1,
    timeStatusId: 1,
    activityStatusId: 1,
    leadTeamId: validLeadTeamId,
    leadMinistryId: validLeadMinistryId,
    commsContacts: [{ userId: 1, isLead: true }],
    ...overrides,
  };
}

describe('createActivityRequestSchema', () => {
  it('accepts minimal valid request', () => {
    const result = createActivityRequestSchema.parse(minimalCreateRequest());
    expect(result.title).toBe('Test Activity');
    expect(result.leadTeamId).toBe(validLeadTeamId);
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

  it('requires leadTeamId', () => {
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ leadTeamId: undefined })
      )
    ).toThrow();
  });

  it('validates leadTeamId as integer', () => {
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ leadTeamId: 'not-a-number' })
      )
    ).toThrow();
  });

  it('validates leadMinistryId as integer when provided', () => {
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ leadMinistryId: 'not-a-number' })
      )
    ).toThrow();
  });

  it('accepts leadMinistryId as null or undefined', () => {
    createActivityRequestSchema.parse(
      minimalCreateRequest({ leadMinistryId: null })
    );
    createActivityRequestSchema.parse(
      minimalCreateRequest({ leadMinistryId: undefined })
    );
  });

  it('accepts create with commsContacts having exactly one lead', () => {
    const result = createActivityRequestSchema.parse(
      minimalCreateRequest({ commsContacts: [{ userId: 1, isLead: true }] })
    );
    expect(result.commsContacts).toHaveLength(1);
    expect(result.commsContacts?.[0].isLead).toBe(true);
  });

  it('rejects create when commsContacts is missing', () => {
    const withoutComms = minimalCreateRequest();
    delete (withoutComms as Record<string, unknown>).commsContacts;
    expect(() => createActivityRequestSchema.parse(withoutComms)).toThrow();
    const err = createActivityRequestSchema.safeParse(withoutComms);
    if (err.success) throw new Error('Expected failure');
    expect(err.error.issues[0].path).toEqual(['commsContacts']);
    expect(err.error.issues[0].message).toBe('A lead contact is required.');
  });

  it('rejects create when commsContacts is empty array', () => {
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ commsContacts: [] })
      )
    ).toThrow();
    const err = createActivityRequestSchema.safeParse(
      minimalCreateRequest({ commsContacts: [] })
    );
    if (err.success) throw new Error('Expected failure');
    expect(err.error.issues[0].path).toEqual(['commsContacts']);
  });

  it('rejects create when no contact is lead', () => {
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({
          commsContacts: [
            { userId: 1, isLead: false },
            { userId: 2, isLead: false },
          ],
        })
      )
    ).toThrow();
    const err = createActivityRequestSchema.safeParse(
      minimalCreateRequest({
        commsContacts: [{ userId: 1, isLead: false }],
      })
    );
    if (err.success) throw new Error('Expected failure');
    expect(err.error.issues[0].path).toEqual(['commsContacts']);
  });

  it('rejects create when more than one contact is lead', () => {
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({
          commsContacts: [
            { userId: 1, isLead: true },
            { userId: 2, isLead: true },
          ],
        })
      )
    ).toThrow();
    const err = createActivityRequestSchema.safeParse(
      minimalCreateRequest({
        commsContacts: [
          { userId: 1, isLead: true },
          { userId: 2, isLead: true },
        ],
      })
    );
    if (err.success) throw new Error('Expected failure');
    expect(err.error.issues[0].path).toEqual(['commsContacts']);
  });

  it('accepts create with eventPlanners array (id or name per entry)', () => {
    const withId = createActivityRequestSchema.parse(
      minimalCreateRequest({
        eventPlanners: [{ eventPlannerLeadId: 1 }],
      })
    );
    expect(withId.eventPlanners).toEqual([{ eventPlannerLeadId: 1 }]);
    const withName = createActivityRequestSchema.parse(
      minimalCreateRequest({
        eventPlanners: [{ eventPlannerLeadName: 'External Lead' }],
      })
    );
    expect(withName.eventPlanners).toEqual([
      { eventPlannerLeadName: 'External Lead' },
    ]);
  });

  it('accepts create with representatives (no XOR; optional id or name per entry)', () => {
    const withId = createActivityRequestSchema.parse(
      minimalCreateRequest({
        representatives: [{ representativeId: 1 }],
      })
    );
    expect(withId.representatives).toEqual([{ representativeId: 1 }]);
    const withName = createActivityRequestSchema.parse(
      minimalCreateRequest({
        representatives: [{ representativeName: 'Rep Name' }],
      })
    );
    expect(withName.representatives).toEqual([
      { representativeName: 'Rep Name' },
    ]);
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

  it('accepts update with only title (no commsContacts)', () => {
    const result = updateActivityRequestSchema.parse({ title: 'Only title' });
    expect(result.title).toBe('Only title');
  });

  it('accepts update when commsContacts has exactly one lead', () => {
    const result = updateActivityRequestSchema.parse({
      commsContacts: [{ userId: 1, isLead: true }],
    });
    expect(result.commsContacts).toHaveLength(1);
    expect(result.commsContacts?.[0].isLead).toBe(true);
  });

  it('accepts update when commsContacts is empty array', () => {
    updateActivityRequestSchema.parse({ commsContacts: [] });
  });

  it('rejects update when commsContacts has contacts but no lead', () => {
    expect(() =>
      updateActivityRequestSchema.parse({
        commsContacts: [{ userId: 1, isLead: false }],
      })
    ).toThrow();
    const err = updateActivityRequestSchema.safeParse({
      commsContacts: [{ userId: 1, isLead: false }],
    });
    if (err.success) throw new Error('Expected failure');
    expect(err.error.issues[0].path).toEqual(['commsContacts']);
    expect(err.error.issues[0].message).toBe('A lead contact is required.');
  });

  it('rejects update when commsContacts has two leads', () => {
    expect(() =>
      updateActivityRequestSchema.parse({
        commsContacts: [
          { userId: 1, isLead: true },
          { userId: 2, isLead: true },
        ],
      })
    ).toThrow();
    const err = updateActivityRequestSchema.safeParse({
      commsContacts: [
        { userId: 1, isLead: true },
        { userId: 2, isLead: true },
      ],
    });
    if (err.success) throw new Error('Expected failure');
    expect(err.error.issues[0].path).toEqual(['commsContacts']);
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
