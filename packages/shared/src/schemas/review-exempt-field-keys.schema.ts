import { z } from 'zod';

import { ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_KEY_ENUM_TUPLE } from '../review-exempt-settings';

const KEY_ENUM = ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_KEY_ENUM_TUPLE;

/**
 * Read/update payload: unique allowlisted top-level form keys (admin only).
 * Order is not significant; the transform de-duplicates.
 */
export const reviewExemptFieldKeysSettingsSchema = z
  .object({
    fieldKeys: z.array(z.enum(KEY_ENUM)).transform((arr) => [...new Set(arr)]),
  })
  .strict();

export type ReviewExemptFieldKeysSettings = z.infer<
  typeof reviewExemptFieldKeysSettingsSchema
>;
