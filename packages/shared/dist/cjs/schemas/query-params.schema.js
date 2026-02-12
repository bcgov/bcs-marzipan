"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterActivitiesQuerySchema = exports.lookupQueryParamsSchema = void 0;
const zod_1 = require("zod");
/**
 * Query Parameter Schemas
 *
 * These schemas handle HTTP query parameters which are always strings.
 * They use z.transform().pipe() to convert string inputs to their proper types.
 *
 * NOTE: Isolated in a separate file to prevent Zod v4 type inference issues
 * from affecting other schema type inferences (like z.infer on response schemas).
 */
// ============================================
// Lookup Query Params
// ============================================
/**
 * Query params for lookup endpoints
 */
exports.lookupQueryParamsSchema = zod_1.z.object({
    userId: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int()).optional(),
    role: zod_1.z.string().optional(),
    organizationId: zod_1.z.string().uuid().optional(),
    userIds: zod_1.z
        .union([
        zod_1.z.array(zod_1.z.string().transform(Number).pipe(zod_1.z.number().int())),
        zod_1.z.string().transform((val) => val
            .split(',')
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !isNaN(id))),
    ])
        .optional(),
});
// ============================================
// Activity Filter Query Params
// ============================================
/**
 * Schema for filtering activities (query parameters)
 * Uses z.transform().pipe() for proper type conversion from HTTP strings
 */
exports.filterActivitiesQuerySchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    startDateFrom: zod_1.z.string().date().optional(),
    startDateTo: zod_1.z.string().date().optional(),
    endDateFrom: zod_1.z.string().date().optional(),
    endDateTo: zod_1.z.string().date().optional(),
    activityStatusId: zod_1.z
        .string()
        .transform(Number)
        .pipe(zod_1.z.number().int())
        .optional(),
    leadMinistryId: zod_1.z.string().uuid().optional(),
    city: zod_1.z.string().optional(),
    isIssue: zod_1.z
        .string()
        .transform((val) => val === 'true')
        .pipe(zod_1.z.boolean())
        .optional(),
    page: zod_1.z
        .string()
        .default('1')
        .transform(Number)
        .pipe(zod_1.z.number().int().positive()),
    limit: zod_1.z
        .string()
        .default('20')
        .transform(Number)
        .pipe(zod_1.z.number().int().positive().min(1).max(100)),
});
