"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const constants_1 = require("../constants/constants");
const activity_schema_1 = require("./activity.schema");
const validLeadMinistryId = '550e8400-e29b-41d4-a716-446655440000';
function minimalCreateRequest(overrides = {}) {
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
(0, vitest_1.describe)('createActivityRequestSchema', () => {
    (0, vitest_1.it)('accepts minimal valid request', () => {
        const result = activity_schema_1.createActivityRequestSchema.parse(minimalCreateRequest());
        (0, vitest_1.expect)(result.title).toBe('Test Activity');
        (0, vitest_1.expect)(result.leadMinistryId).toBe(validLeadMinistryId);
    });
    (0, vitest_1.it)('enforces title min 1 and max 255', () => {
        activity_schema_1.createActivityRequestSchema.parse(minimalCreateRequest({ title: 'x' }));
        (0, vitest_1.expect)(() => activity_schema_1.createActivityRequestSchema.parse(minimalCreateRequest({ title: '' }))).toThrow();
        (0, vitest_1.expect)(() => activity_schema_1.createActivityRequestSchema.parse(minimalCreateRequest({ title: 'a'.repeat(256) }))).toThrow();
    });
    (0, vitest_1.it)('enforces summary max 1000 and significance max 1000', () => {
        (0, vitest_1.expect)(() => activity_schema_1.createActivityRequestSchema.parse(minimalCreateRequest({ summary: 'a'.repeat(1001) }))).toThrow();
        (0, vitest_1.expect)(() => activity_schema_1.createActivityRequestSchema.parse(minimalCreateRequest({ significance: 'a'.repeat(1001) }))).toThrow();
    });
    (0, vitest_1.it)('accepts valid enums for visibility, lookAheadStatus, lookAheadSection', () => {
        for (const v of constants_1.VISIBILITY) {
            activity_schema_1.createActivityRequestSchema.parse(minimalCreateRequest({ visibility: v }));
        }
        activity_schema_1.createActivityRequestSchema.parse(minimalCreateRequest({
            lookAheadStatus: constants_1.DEFAULT_LOOK_AHEAD_STATUS,
            lookAheadSection: constants_1.DEFAULT_LOOK_AHEAD_SECTION,
        }));
    });
    (0, vitest_1.it)('rejects invalid visibility', () => {
        (0, vitest_1.expect)(() => activity_schema_1.createActivityRequestSchema.parse(minimalCreateRequest({ visibility: 'invalid' }))).toThrow();
    });
    (0, vitest_1.it)('accepts venueAddress as nullable/optional', () => {
        activity_schema_1.createActivityRequestSchema.parse(minimalCreateRequest({ venueAddress: null }));
        activity_schema_1.createActivityRequestSchema.parse(minimalCreateRequest());
        activity_schema_1.createActivityRequestSchema.parse(minimalCreateRequest({
            venueAddress: {
                venueName: 'Hall',
                street: null,
                city: null,
                provinceOrState: null,
                country: null,
            },
        }));
    });
    (0, vitest_1.it)('transforms empty string to null for leadOrgId (emptyStringToNull)', () => {
        const result = activity_schema_1.createActivityRequestSchema.parse(minimalCreateRequest({ leadOrgId: '' }));
        (0, vitest_1.expect)(result.leadOrgId).toBeNull();
    });
    (0, vitest_1.it)('validates leadMinistryId as UUID', () => {
        (0, vitest_1.expect)(() => activity_schema_1.createActivityRequestSchema.parse(minimalCreateRequest({ leadMinistryId: 'not-a-uuid' }))).toThrow();
    });
});
(0, vitest_1.describe)('updateActivityRequestSchema', () => {
    (0, vitest_1.it)('accepts partial update with only some fields', () => {
        const result = activity_schema_1.updateActivityRequestSchema.parse({ title: 'Updated' });
        (0, vitest_1.expect)(result.title).toBe('Updated');
    });
    (0, vitest_1.it)('accepts empty object', () => {
        activity_schema_1.updateActivityRequestSchema.parse({});
    });
});
(0, vitest_1.describe)('venueAddressFieldsSchema', () => {
    (0, vitest_1.it)('accepts null', () => {
        (0, vitest_1.expect)(activity_schema_1.venueAddressFieldsSchema.parse(null)).toBeNull();
    });
    (0, vitest_1.it)('accepts undefined (optional)', () => {
        (0, vitest_1.expect)(activity_schema_1.venueAddressFieldsSchema.parse(undefined)).toBeUndefined();
    });
    (0, vitest_1.it)('accepts valid venue object with nullables', () => {
        const v = {
            venueName: 'Hall',
            street: null,
            city: 'Victoria',
            provinceOrState: null,
            country: 'Canada',
        };
        (0, vitest_1.expect)(activity_schema_1.venueAddressFieldsSchema.parse(v)).toEqual(v);
    });
});
