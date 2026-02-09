import { z } from 'zod';
/**
 * Query Parameter Schemas
 *
 * These schemas handle HTTP query parameters which are always strings.
 * They use z.transform().pipe() to convert string inputs to their proper types.
 *
 * NOTE: Isolated in a separate file to prevent Zod v4 type inference issues
 * from affecting other schema type inferences (like z.infer on response schemas).
 */
/**
 * Query params for lookup endpoints
 */
export declare const lookupQueryParamsSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
    role: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    userIds: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>, z.ZodPipe<z.ZodString, z.ZodTransform<number[], string>>]>>;
}, z.core.$strip>;
export type LookupQueryParams = z.infer<typeof lookupQueryParamsSchema>;
/**
 * Schema for filtering activities (query parameters)
 * Uses z.transform().pipe() for proper type conversion from HTTP strings
 */
export declare const filterActivitiesQuerySchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    startDateFrom: z.ZodOptional<z.ZodString>;
    startDateTo: z.ZodOptional<z.ZodString>;
    endDateFrom: z.ZodOptional<z.ZodString>;
    endDateTo: z.ZodOptional<z.ZodString>;
    activityStatusId: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
    leadMinistryId: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    isIssue: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<boolean, string>>, z.ZodBoolean>>;
    page: z.ZodPipe<z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<number, string>>, z.ZodNumber>;
    limit: z.ZodPipe<z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<number, string>>, z.ZodNumber>;
}, z.core.$strip>;
export type FilterActivitiesQueryParams = z.infer<typeof filterActivitiesQuerySchema>;
//# sourceMappingURL=query-params.schema.d.ts.map