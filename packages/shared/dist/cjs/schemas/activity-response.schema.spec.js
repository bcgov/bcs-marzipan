"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const constants_1 = require("../constants/constants");
const activity_response_schema_1 = require("./activity-response.schema");
const test_utils_1 = require("../test-utils");
(0, vitest_1.describe)('activityResponseSchema', () => {
    (0, vitest_1.it)('accepts minimal valid response', () => {
        const result = activity_response_schema_1.activityResponseSchema.parse((0, test_utils_1.createMockActivityResponse)());
        (0, vitest_1.expect)(result.id).toBe(1);
        (0, vitest_1.expect)(result.visibility).toBe(constants_1.DEFAULT_VISIBILITY);
    });
    (0, vitest_1.it)('accepts valid lookAheadStatus enums', () => {
        for (const s of constants_1.LOOK_AHEAD_STATUS) {
            activity_response_schema_1.activityResponseSchema.parse((0, test_utils_1.createMockActivityResponse)({ lookAheadStatus: s }));
        }
    });
    (0, vitest_1.it)('accepts valid lookAheadSection enums', () => {
        for (const s of constants_1.LOOK_AHEAD_SECTION) {
            activity_response_schema_1.activityResponseSchema.parse((0, test_utils_1.createMockActivityResponse)({ lookAheadSection: s }));
        }
    });
    (0, vitest_1.it)('accepts valid visibility enums', () => {
        for (const v of constants_1.VISIBILITY) {
            activity_response_schema_1.activityResponseSchema.parse((0, test_utils_1.createMockActivityResponse)({ visibility: v }));
        }
    });
    (0, vitest_1.it)('rejects invalid lookAheadStatus', () => {
        (0, vitest_1.expect)(() => activity_response_schema_1.activityResponseSchema.parse(
        // @ts-expect-error Testing invalid value
        (0, test_utils_1.createMockActivityResponse)({ lookAheadStatus: 'invalid' }))).toThrow();
    });
    (0, vitest_1.it)('rejects invalid visibility', () => {
        (0, vitest_1.expect)(() => activity_response_schema_1.activityResponseSchema.parse(
        // @ts-expect-error Testing invalid value
        (0, test_utils_1.createMockActivityResponse)({ visibility: 'invalid' }))).toThrow();
    });
    (0, vitest_1.it)('accepts optional nulls for nullable fields', () => {
        activity_response_schema_1.activityResponseSchema.parse((0, test_utils_1.createMockActivityResponse)({
            lookAheadStatus: null,
            lookAheadSection: null,
            leadOrgId: null,
        }));
    });
});
