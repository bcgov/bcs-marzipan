import { z } from 'zod';

import { VISIBILITY } from '../constants/constants';

const teamIdsField = z.array(z.number().int()).optional();

const lookupVisibilityFields = {
  visibility: z.enum(VISIBILITY).default('global').optional(),
  teamIds: teamIdsField,
};

/**
 * Validates team-scoped lookups require at least one team.
 * Global visibility ignores teamIds.
 */
export function refineLookupTeamVisibility<
  T extends { visibility?: (typeof VISIBILITY)[number]; teamIds?: number[] },
>(schema: z.ZodType<T>): z.ZodType<T> {
  return schema.superRefine((data, ctx) => {
    if (data.visibility === 'team') {
      const count = data.teamIds?.length ?? 0;
      if (count < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one team is required when visibility is team',
          path: ['teamIds'],
        });
      }
    }
  });
}

export const lookupVisibilityRequestFields = lookupVisibilityFields;
