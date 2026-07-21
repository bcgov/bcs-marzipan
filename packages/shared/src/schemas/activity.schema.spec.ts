import { describe, expect, it } from 'vitest';

import { DEFAULT_LOOK_AHEAD_STATUS, VISIBILITY } from '../constants/constants';
import {
  ACTIVITY_RICH_TEXT_MAX_BYTES,
  EMPTY_RICH_TEXT_DOC,
  tipTapDocJsonFromPlainText,
} from '../utils/activity-rich-text';
import {
  ACTIVITY_SUMMARY_MAX_LENGTH,
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
    categoryIds: [1],
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
    const emptyTitle = createActivityRequestSchema.safeParse(
      minimalCreateRequest({ title: '' })
    );
    if (emptyTitle.success) throw new Error('Expected failure');
    expect(emptyTitle.error.issues[0].path).toEqual(['title']);
    expect(emptyTitle.error.issues[0].message).toBe(
      'An activity title is required'
    );
    const missingTitle = minimalCreateRequest();
    delete (missingTitle as Record<string, unknown>).title;
    const undefinedTitle = createActivityRequestSchema.safeParse(missingTitle);
    if (undefinedTitle.success) throw new Error('Expected failure');
    expect(undefinedTitle.error.issues[0].path).toEqual(['title']);
    expect(undefinedTitle.error.issues[0].message).toBe(
      'An activity title is required'
    );
    const tooLongTitle = createActivityRequestSchema.safeParse(
      minimalCreateRequest({ title: 'a'.repeat(256) })
    );
    if (tooLongTitle.success) throw new Error('Expected failure');
    expect(tooLongTitle.error.issues[0].path).toEqual(['title']);
    expect(tooLongTitle.error.issues[0].message).toBe(
      'Maximum character limit exceeded'
    );
  });

  it('rejects create when summary is empty or missing', () => {
    const emptySummary = createActivityRequestSchema.safeParse(
      minimalCreateRequest({ summary: '' })
    );
    if (emptySummary.success) throw new Error('Expected failure');
    expect(emptySummary.error.issues.some((i) => i.path[0] === 'summary')).toBe(
      true
    );
    expect(
      emptySummary.error.issues.find((i) => i.path[0] === 'summary')?.message
    ).toBe('A summary is required');

    const missingSummary = minimalCreateRequest();
    delete (missingSummary as Record<string, unknown>).summary;
    const undefinedSummary =
      createActivityRequestSchema.safeParse(missingSummary);
    if (undefinedSummary.success) throw new Error('Expected failure');
    expect(
      undefinedSummary.error.issues.find((i) => i.path[0] === 'summary')
        ?.message
    ).toBe('A summary is required');
  });

  it('enforces summary max plain-text length (1000)', () => {
    createActivityRequestSchema.parse(
      minimalCreateRequest({
        summary: 'a'.repeat(ACTIVITY_SUMMARY_MAX_LENGTH),
      })
    );

    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({
          summary: 'a'.repeat(ACTIVITY_SUMMARY_MAX_LENGTH + 1),
        })
      )
    ).toThrow();

    const richSummary = tipTapDocJsonFromPlainText(
      'b'.repeat(ACTIVITY_SUMMARY_MAX_LENGTH)
    );
    createActivityRequestSchema.parse(
      minimalCreateRequest({ summary: richSummary })
    );

    const tooLongRichSummary = tipTapDocJsonFromPlainText(
      'b'.repeat(ACTIVITY_SUMMARY_MAX_LENGTH + 1)
    );
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ summary: tooLongRichSummary })
      )
    ).toThrow();
  });

  it('enforces summary and significance max rich-text bytes and valid storage', () => {
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({
          summary: 'a'.repeat(ACTIVITY_RICH_TEXT_MAX_BYTES + 1),
        })
      )
    ).toThrow();
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({
          significance: 'a'.repeat(ACTIVITY_RICH_TEXT_MAX_BYTES + 1),
        })
      )
    ).toThrow();
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ summary: '{"type":"paragraph"}' })
      )
    ).toThrow();
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ significance: '{"type":"paragraph"}' })
      )
    ).toThrow();
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ summary: EMPTY_RICH_TEXT_DOC })
      )
    ).toThrow();
  });

  it('enforces strategy and notes max length (1000)', () => {
    createActivityRequestSchema.parse(
      minimalCreateRequest({
        strategy: 'a'.repeat(1000),
        notes: 'b'.repeat(1000),
      })
    );

    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ strategy: 'a'.repeat(1001) })
      )
    ).toThrow();

    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ notes: 'b'.repeat(1001) })
      )
    ).toThrow();
  });

  it('accepts create with empty-doc significance (optional rich field)', () => {
    const result = createActivityRequestSchema.parse(
      minimalCreateRequest({ significance: EMPTY_RICH_TEXT_DOC })
    );
    expect(result.significance).toBe(EMPTY_RICH_TEXT_DOC);
  });

  it('accepts create without significance or with null significance', () => {
    const without = createActivityRequestSchema.parse(
      minimalCreateRequest({ significance: undefined })
    );
    expect(without.significance).toBeUndefined();
    const explicitNull = createActivityRequestSchema.parse(
      minimalCreateRequest({ significance: null })
    );
    expect(explicitNull.significance).toBeNull();
  });

  it('rejects create when categoryIds is missing or empty', () => {
    const missing = minimalCreateRequest();
    delete (missing as Record<string, unknown>).categoryIds;
    expect(() => createActivityRequestSchema.parse(missing)).toThrow();
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ categoryIds: [] })
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
        lookAheadSection: 'events',
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
          addressLine1: null,
          addressLine2: null,
          city: null,
          provinceOrState: null,
          country: null,
        },
      })
    );
    createActivityRequestSchema.parse(
      minimalCreateRequest({
        venueAddress: { city: 'Victoria', country: 'Canada' },
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
    expect(err.error.issues[0].message).toBe('A lead contact is required');
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

  it('accepts create with eventPlanners array (id or name per entry, isLead)', () => {
    const withId = createActivityRequestSchema.parse(
      minimalCreateRequest({
        eventPlanners: [{ eventPlannerId: 1, isLead: true }],
      })
    );
    expect(withId.eventPlanners).toEqual([
      { eventPlannerId: 1, eventPlannerName: undefined, isLead: true },
    ]);
    const withName = createActivityRequestSchema.parse(
      minimalCreateRequest({
        eventPlanners: [{ eventPlannerName: 'External Lead', isLead: true }],
      })
    );
    expect(withName.eventPlanners).toEqual([
      {
        eventPlannerId: undefined,
        eventPlannerName: 'External Lead',
        isLead: true,
      },
    ]);
  });

  it('rejects create when eventPlanners has entries but no lead', () => {
    const err = createActivityRequestSchema.safeParse(
      minimalCreateRequest({
        eventPlanners: [
          { eventPlannerId: 1, isLead: false },
          { eventPlannerName: 'Other', isLead: false },
        ],
      })
    );
    if (err.success) throw new Error('Expected failure');
    expect(err.error.issues[0].path).toEqual(['eventPlanners']);
    expect(err.error.issues[0].message).toBe(
      'When event planners are provided, exactly one must be marked as lead'
    );
  });

  it('rejects create when eventPlanners has two leads', () => {
    const err = createActivityRequestSchema.safeParse(
      minimalCreateRequest({
        eventPlanners: [
          { eventPlannerId: 1, isLead: true },
          { eventPlannerName: 'Other', isLead: true },
        ],
      })
    );
    if (err.success) throw new Error('Expected failure');
    expect(err.error.issues[0].path).toEqual(['eventPlanners']);
  });

  it('accepts create with representatives (id or non-empty name per entry)', () => {
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

  it('rejects create when a representative entry has no id and no name', () => {
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({ representatives: [{}] })
      )
    ).toThrow();
  });

  it('rejects create when representativeId is zero and name is missing', () => {
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({
          representatives: [{ representativeId: 0 }],
        })
      )
    ).toThrow();
  });

  it('rejects create when representativeName is only whitespace', () => {
    expect(() =>
      createActivityRequestSchema.parse(
        minimalCreateRequest({
          representatives: [{ representativeName: '   ' }],
        })
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

  it('rejects update when representatives contains an empty entry', () => {
    expect(() =>
      updateActivityRequestSchema.parse({ representatives: [{}] })
    ).toThrow();
  });

  it('accepts update with only title (no commsContacts)', () => {
    const result = updateActivityRequestSchema.parse({ title: 'Only title' });
    expect(result.title).toBe('Only title');
  });

  it('enforces summary max plain-text length when provided on update', () => {
    updateActivityRequestSchema.parse({
      summary: 'a'.repeat(ACTIVITY_SUMMARY_MAX_LENGTH),
    });

    expect(() =>
      updateActivityRequestSchema.parse({
        summary: 'a'.repeat(ACTIVITY_SUMMARY_MAX_LENGTH + 1),
      })
    ).toThrow();
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
    expect(err.error.issues[0].message).toBe('A lead contact is required');
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

  it('accepts update when eventPlanners has exactly one lead', () => {
    const result = updateActivityRequestSchema.parse({
      eventPlanners: [
        { eventPlannerId: 1, isLead: true },
        { eventPlannerName: 'Other', isLead: false },
      ],
    });
    expect(result.eventPlanners).toHaveLength(2);
    expect(result.eventPlanners?.[0].isLead).toBe(true);
    expect(result.eventPlanners?.[1].isLead).toBe(false);
  });

  it('rejects update when eventPlanners has entries but no lead', () => {
    const err = updateActivityRequestSchema.safeParse({
      eventPlanners: [
        { eventPlannerId: 1, isLead: false },
        { eventPlannerName: 'Other', isLead: false },
      ],
    });
    if (err.success) throw new Error('Expected failure');
    expect(err.error.issues[0].path).toEqual(['eventPlanners']);
  });

  it('rejects update when categoryIds is empty array', () => {
    const err = updateActivityRequestSchema.safeParse({ categoryIds: [] });
    if (err.success) throw new Error('Expected failure');
    expect(err.error.issues[0].path).toEqual(['categoryIds']);
    expect(err.error.issues[0].message).toBe(
      'At least one category is required'
    );
  });

  it('accepts update when categoryIds is omitted', () => {
    updateActivityRequestSchema.parse({ title: 'x' });
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
      addressLine1: null,
      addressLine2: null,
      city: 'Victoria',
      provinceOrState: null,
      country: 'Canada',
    };
    expect(venueAddressFieldsSchema.parse(v)).toEqual(v);
  });

  it('accepts addressLine2 (floor, room, etc.)', () => {
    const v = {
      venueName: 'Convention Centre',
      addressLine1: '123 Main St',
      addressLine2: 'Suite 400',
      city: 'Victoria',
      provinceOrState: 'BC',
      country: 'Canada',
    };
    expect(venueAddressFieldsSchema.parse(v)).toEqual(v);
  });

  it('enforces venue address text max length (255)', () => {
    const valid = {
      venueName: 'v'.repeat(255),
      addressLine1: 'a'.repeat(255),
      addressLine2: 'b'.repeat(255),
      city: 'c'.repeat(255),
      provinceOrState: 'p'.repeat(255),
      country: 'n'.repeat(255),
    };
    expect(venueAddressFieldsSchema.parse(valid)).toEqual(valid);

    expect(() =>
      venueAddressFieldsSchema.parse({
        ...valid,
        addressLine2: 'b'.repeat(256),
      })
    ).toThrow();
  });

  it('accepts partial venue object (independent fields)', () => {
    const partial = { city: 'Victoria', country: 'Canada' };
    expect(venueAddressFieldsSchema.parse(partial)).toEqual(partial);
  });
});
