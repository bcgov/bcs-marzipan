"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const query_params_schema_1 = require("./query-params.schema");
(0, vitest_1.describe)('lookupQueryParamsSchema', () => {
    (0, vitest_1.it)('accepts valid empty input', () => {
        const result = query_params_schema_1.lookupQueryParamsSchema.parse({});
        (0, vitest_1.expect)(result).toEqual({});
    });
    (0, vitest_1.it)('parses userId as integer', () => {
        (0, vitest_1.expect)(query_params_schema_1.lookupQueryParamsSchema.parse({ userId: '42' })).toEqual({
            userId: 42,
        });
    });
    (0, vitest_1.it)('accepts role as string', () => {
        (0, vitest_1.expect)(query_params_schema_1.lookupQueryParamsSchema.parse({ role: 'admin' })).toEqual({
            role: 'admin',
        });
    });
    (0, vitest_1.it)('validates organizationId as UUID', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        (0, vitest_1.expect)(query_params_schema_1.lookupQueryParamsSchema.parse({ organizationId: uuid })).toEqual({
            organizationId: uuid,
        });
    });
    (0, vitest_1.it)('rejects invalid organizationId (non-UUID)', () => {
        (0, vitest_1.expect)(() => query_params_schema_1.lookupQueryParamsSchema.parse({ organizationId: 'not-a-uuid' })).toThrow();
    });
    (0, vitest_1.it)('parses userIds as comma-separated string to array of ints', () => {
        (0, vitest_1.expect)(query_params_schema_1.lookupQueryParamsSchema.parse({ userIds: '1,2,3' })).toEqual({
            userIds: [1, 2, 3],
        });
    });
    (0, vitest_1.it)('parses userIds string with spaces and filters NaN', () => {
        const result = query_params_schema_1.lookupQueryParamsSchema.parse({ userIds: '1, 2, x, 4' });
        (0, vitest_1.expect)(result.userIds).toEqual([1, 2, 4]);
    });
    (0, vitest_1.it)('accepts userIds as array of string ints', () => {
        (0, vitest_1.expect)(query_params_schema_1.lookupQueryParamsSchema.parse({ userIds: ['1', '2', '3'] })).toEqual({
            userIds: [1, 2, 3],
        });
    });
    (0, vitest_1.it)('rejects userId non-integer', () => {
        (0, vitest_1.expect)(() => query_params_schema_1.lookupQueryParamsSchema.parse({ userId: 'x' })).toThrow();
    });
    (0, vitest_1.it)('rejects userId non-integer (float string)', () => {
        (0, vitest_1.expect)(() => query_params_schema_1.lookupQueryParamsSchema.parse({ userId: '1.5' })).toThrow();
    });
});
(0, vitest_1.describe)('filterActivitiesQuerySchema', () => {
    (0, vitest_1.it)('applies defaults for page and limit when omitted', () => {
        const result = query_params_schema_1.filterActivitiesQuerySchema.parse({});
        (0, vitest_1.expect)(result.page).toBe(1);
        (0, vitest_1.expect)(result.limit).toBe(20);
    });
    (0, vitest_1.it)('parses page and limit as positive ints', () => {
        const result = query_params_schema_1.filterActivitiesQuerySchema.parse({
            page: '2',
            limit: '50',
        });
        (0, vitest_1.expect)(result.page).toBe(2);
        (0, vitest_1.expect)(result.limit).toBe(50);
    });
    (0, vitest_1.it)('accepts valid optional fields', () => {
        const result = query_params_schema_1.filterActivitiesQuerySchema.parse({
            title: 'Test',
            startDateFrom: '2025-01-01',
            startDateTo: '2025-12-31',
            activityStatusId: '1',
            leadMinistryId: '550e8400-e29b-41d4-a716-446655440000',
            city: 'Victoria',
            isIssue: 'true',
        });
        (0, vitest_1.expect)(result.title).toBe('Test');
        (0, vitest_1.expect)(result.startDateFrom).toBe('2025-01-01');
        (0, vitest_1.expect)(result.startDateTo).toBe('2025-12-31');
        (0, vitest_1.expect)(result.activityStatusId).toBe(1);
        (0, vitest_1.expect)(result.leadMinistryId).toBe('550e8400-e29b-41d4-a716-446655440000');
        (0, vitest_1.expect)(result.city).toBe('Victoria');
        (0, vitest_1.expect)(result.isIssue).toBe(true);
    });
    (0, vitest_1.it)('transforms isIssue "true" to true', () => {
        (0, vitest_1.expect)(query_params_schema_1.filterActivitiesQuerySchema.parse({ isIssue: 'true' }).isIssue).toBe(true);
    });
    (0, vitest_1.it)('transforms isIssue "false" to false', () => {
        (0, vitest_1.expect)(query_params_schema_1.filterActivitiesQuerySchema.parse({ isIssue: 'false' }).isIssue).toBe(false);
    });
    (0, vitest_1.it)('rejects invalid date for startDateFrom', () => {
        (0, vitest_1.expect)(() => query_params_schema_1.filterActivitiesQuerySchema.parse({ startDateFrom: '2025-13-45' })).toThrow();
    });
    (0, vitest_1.it)('rejects invalid UUID for leadMinistryId', () => {
        (0, vitest_1.expect)(() => query_params_schema_1.filterActivitiesQuerySchema.parse({ leadMinistryId: 'not-a-uuid' })).toThrow();
    });
    (0, vitest_1.it)('rejects non-integer activityStatusId', () => {
        (0, vitest_1.expect)(() => query_params_schema_1.filterActivitiesQuerySchema.parse({ activityStatusId: 'x' })).toThrow();
    });
    (0, vitest_1.it)('rejects page less than 1', () => {
        (0, vitest_1.expect)(() => query_params_schema_1.filterActivitiesQuerySchema.parse({ page: '0' })).toThrow();
    });
    (0, vitest_1.it)('rejects limit greater than 100', () => {
        (0, vitest_1.expect)(() => query_params_schema_1.filterActivitiesQuerySchema.parse({ limit: '101' })).toThrow();
    });
    (0, vitest_1.it)('accepts limit 1 and 100', () => {
        (0, vitest_1.expect)(query_params_schema_1.filterActivitiesQuerySchema.parse({ limit: '1' }).limit).toBe(1);
        (0, vitest_1.expect)(query_params_schema_1.filterActivitiesQuerySchema.parse({ limit: '100' }).limit).toBe(100);
    });
});
