import { describe, it, expect } from 'vitest';
import { DEFAULT_VISIBILITY, LOOK_AHEAD_SECTION, LOOK_AHEAD_STATUS, VISIBILITY, } from '../constants/constants';
import { activityResponseSchema } from './activity-response.schema';
import { createMockActivityResponse } from '../test-utils';
describe('activityResponseSchema', () => {
    it('accepts minimal valid response', () => {
        const result = activityResponseSchema.parse(createMockActivityResponse());
        expect(result.id).toBe(1);
        expect(result.visibility).toBe(DEFAULT_VISIBILITY);
    });
    it('accepts valid lookAheadStatus enums', () => {
        for (const s of LOOK_AHEAD_STATUS) {
            activityResponseSchema.parse(createMockActivityResponse({ lookAheadStatus: s }));
        }
    });
    it('accepts valid lookAheadSection enums', () => {
        for (const s of LOOK_AHEAD_SECTION) {
            activityResponseSchema.parse(createMockActivityResponse({ lookAheadSection: s }));
        }
    });
    it('accepts valid visibility enums', () => {
        for (const v of VISIBILITY) {
            activityResponseSchema.parse(createMockActivityResponse({ visibility: v }));
        }
    });
    it('rejects invalid lookAheadStatus', () => {
        expect(() => activityResponseSchema.parse(
        // @ts-expect-error Testing invalid value
        createMockActivityResponse({ lookAheadStatus: 'invalid' }))).toThrow();
    });
    it('rejects invalid visibility', () => {
        expect(() => activityResponseSchema.parse(
        // @ts-expect-error Testing invalid value
        createMockActivityResponse({ visibility: 'invalid' }))).toThrow();
    });
    it('accepts optional nulls for nullable fields', () => {
        activityResponseSchema.parse(createMockActivityResponse({
            lookAheadStatus: null,
            lookAheadSection: null,
            leadOrgId: null,
        }));
    });
});
