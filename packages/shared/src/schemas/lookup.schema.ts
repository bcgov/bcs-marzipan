import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import {
  categories,
  tags,
  pitchStatuses,
  commsMaterials,
  translatedLanguages,
  governmentRepresentatives,
  activityStatuses,
  dateStatuses,
  timeStatuses,
  venueStatuses,
  cities,
} from '@corpcal/database/schema';
import { organizations } from '@corpcal/database/schema';
import { ministries } from '@corpcal/database/schema';
import { systemUsers } from '@corpcal/database/schema';
import { REPRESENTATIVE_TYPE } from '../constants/activity-enums';

/**
 * Lookup Response Schemas
 *
 * These schemas are automatically generated from Drizzle table schemas
 * using createSelectSchema, then transformed to match the API contract.
 *
 * Each lookup type has its own schema for full type safety while also
 * providing a common LookupItem interface for generic dropdown components.
 */

// ============================================
// Base Lookup Item Schema (Generic)
// ============================================

/**
 * Generic lookup item schema for dropdown components
 * All lookup endpoints return data in this format for UI consistency
 */
export const lookupItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  label: z.string(),
  value: z.union([z.string(), z.number()]),
});

/**
 * Extended lookup item with optional additional fields
 * Used when lookups need extra metadata beyond the basic dropdown format
 */
export const extendedLookupItemSchema = lookupItemSchema.extend({
  name: z.string().optional(),
  displayName: z.string().nullable().optional(),
});

// ============================================
// Category Schema
// ============================================

const baseCategorySchema = createSelectSchema(categories);

export const categoryResponseSchema = baseCategorySchema
  .pick({
    id: true,
    name: true,
    displayName: true,
    sortOrder: true,
    isActive: true,
    description: true,
    pitchRequired: true,
  })
  .extend({
    id: z.number().int(),
    name: z.string(),
    displayName: z.string().nullable(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    description: z.string().nullable(),
    pitchRequired: z.boolean(),
  });

export const categoryLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string().nullable(),
});

// ============================================
// Tag Schema
// ============================================

const baseTagSchema = createSelectSchema(tags);

export const tagResponseSchema = baseTagSchema
  .pick({
    id: true,
    key: true,
    displayName: true,
    sortOrder: true,
    isActive: true,
  })
  .extend({
    id: z.string().uuid(),
    key: z.string().nullable(),
    displayName: z.string().nullable(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
  });

export const tagLookupItemSchema = lookupItemSchema.extend({
  key: z.string().nullable(),
  displayName: z.string().nullable(),
});

// ============================================
// Organization Schema
// ============================================

const baseOrganizationSchema = createSelectSchema(organizations);

export const organizationResponseSchema = baseOrganizationSchema
  .pick({
    id: true,
    name: true,
    displayName: true,
    organizationType: true,
    ministryId: true,
    isActive: true,
    sortOrder: true,
    description: true,
  })
  .extend({
    id: z.string().uuid(),
    name: z.string(),
    displayName: z.string().nullable(),
    organizationType: z.string().nullable(),
    ministryId: z.string().uuid().nullable(),
    isActive: z.boolean(),
    sortOrder: z.number().int(),
    description: z.string().nullable(),
  });

export const organizationLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string().nullable(),
});

// ============================================
// Ministry Schema
// ============================================

const baseMinistrySchema = createSelectSchema(ministries);

export const ministryResponseSchema = baseMinistrySchema
  .pick({
    id: true,
    displayName: true,
    abbreviation: true,
    sortOrder: true,
    isActive: true,
    ministerName: true,
  })
  .extend({
    id: z.string().uuid(),
    displayName: z.string().nullable(),
    abbreviation: z.string().nullable(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    ministerName: z.string().nullable(),
  });

export const ministryLookupItemSchema = lookupItemSchema.extend({
  displayName: z.string().nullable(),
  abbreviation: z.string().nullable(),
});

// ============================================
// System User Schema
// ============================================

const baseSystemUserSchema = createSelectSchema(systemUsers);

export const systemUserResponseSchema = baseSystemUserSchema
  .pick({
    id: true,
    adUsername: true,
    adDisplayName: true,
    adEmail: true,
    isActive: true,
    role: true,
  })
  .extend({
    id: z.number().int(),
    adUsername: z.string().nullable(),
    adDisplayName: z.string().nullable(),
    adEmail: z.string().nullable(),
    isActive: z.boolean(),
    role: z.string(),
  });

export const userLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  email: z.string().nullable(),
  username: z.string().nullable(),
});

// ============================================
// Pitch Status Schema
// ============================================

const basePitchStatusSchema = createSelectSchema(pitchStatuses);

export const pitchStatusResponseSchema = basePitchStatusSchema
  .pick({
    id: true,
    name: true,
    displayName: true,
    sortOrder: true,
    isActive: true,
    description: true,
  })
  .extend({
    id: z.number().int(),
    name: z.string(),
    displayName: z.string().nullable(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    description: z.string().nullable(),
  });

export const pitchStatusLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string().nullable(),
});

// ============================================
// Activity Status Schema
// ============================================

const baseActivityStatusSchema = createSelectSchema(activityStatuses);

export const activityStatusResponseSchema = baseActivityStatusSchema
  .pick({
    id: true,
    name: true,
    displayName: true,
    sortOrder: true,
    isActive: true,
    description: true,
  })
  .extend({
    id: z.number().int(),
    name: z.string(),
    displayName: z.string().nullable(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    description: z.string().nullable(),
  });

export const activityStatusLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string().nullable(),
});

// ============================================
// Date Status Schema
// ============================================

const baseDateStatusSchema = createSelectSchema(dateStatuses);

export const dateStatusResponseSchema = baseDateStatusSchema
  .pick({
    id: true,
    name: true,
    displayName: true,
    sortOrder: true,
    isActive: true,
    description: true,
  })
  .extend({
    id: z.number().int(),
    name: z.string(),
    displayName: z.string().nullable(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    description: z.string().nullable(),
  });

export const dateStatusLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string().nullable(),
});

// ============================================
// Time Status Schema
// ============================================

const baseTimeStatusSchema = createSelectSchema(timeStatuses);

export const timeStatusResponseSchema = baseTimeStatusSchema
  .pick({
    id: true,
    name: true,
    displayName: true,
    sortOrder: true,
    isActive: true,
    description: true,
  })
  .extend({
    id: z.number().int(),
    name: z.string(),
    displayName: z.string().nullable(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    description: z.string().nullable(),
  });

export const timeStatusLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string().nullable(),
});

// ============================================
// Venue Status Schema
// ============================================

const baseVenueStatusSchema = createSelectSchema(venueStatuses);

export const venueStatusResponseSchema = baseVenueStatusSchema
  .pick({
    id: true,
    name: true,
    displayName: true,
    sortOrder: true,
    isActive: true,
    description: true,
  })
  .extend({
    id: z.number().int(),
    name: z.string(),
    displayName: z.string().nullable(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    description: z.string().nullable(),
  });

export const venueStatusLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string().nullable(),
});

// ============================================
// City Schema
// ============================================

const baseCitySchema = createSelectSchema(cities);

export const cityResponseSchema = baseCitySchema
  .pick({
    id: true,
    name: true,
    displayName: true,
    sortOrder: true,
    isActive: true,
    province: true,
  })
  .extend({
    id: z.number().int(),
    name: z.string(),
    displayName: z.string().nullable(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    province: z.string().nullable(),
  });

export const cityLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string().nullable(),
  province: z.string().nullable(),
});

// ============================================
// Comms Materials Schema
// ============================================

const baseCommsMaterialsSchema = createSelectSchema(commsMaterials);

export const commsMaterialsResponseSchema = baseCommsMaterialsSchema
  .pick({
    id: true,
    name: true,
    displayName: true,
    sortOrder: true,
    isActive: true,
    description: true,
  })
  .extend({
    id: z.number().int(),
    name: z.string(),
    displayName: z.string().nullable(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    description: z.string().nullable(),
  });

export const commsMaterialsLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string().nullable(),
});

// ============================================
// Translation Languages Schema
// ============================================

const baseTranslatedLanguagesSchema = createSelectSchema(translatedLanguages);

export const translationLanguageResponseSchema = baseTranslatedLanguagesSchema
  .pick({
    id: true,
    name: true,
    displayName: true,
    sortOrder: true,
    isActive: true,
    description: true,
  })
  .extend({
    id: z.number().int(),
    name: z.string(),
    displayName: z.string().nullable(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    description: z.string().nullable(),
  });

export const translationLanguageLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string().nullable(),
});

// ============================================
// Government Representatives Schema
// ============================================

const baseGovernmentRepresentativeSchema = createSelectSchema(
  governmentRepresentatives
);

export const governmentRepresentativeResponseSchema =
  baseGovernmentRepresentativeSchema
    .pick({
      id: true,
      name: true,
      displayName: true,
      sortOrder: true,
      isActive: true,
      title: true,
      email: true,
      ministryId: true,
      representativeType: true,
    })
    .extend({
      id: z.number().int(),
      name: z.string(),
      displayName: z.string().nullable(),
      sortOrder: z.number().int(),
      isActive: z.boolean(),
      title: z.string().nullable(),
      email: z.string().nullable(),
      ministryId: z.string().uuid().nullable(),
      representativeType: z.enum(REPRESENTATIVE_TYPE).nullable(),
    });

export const governmentRepresentativeLookupItemSchema = lookupItemSchema.extend(
  {
    name: z.string(),
    displayName: z.string().nullable(),
    title: z.string().nullable(),
    ministryId: z.string().uuid().nullable(),
  }
);

// ============================================
// TypeScript Types (inferred from schemas)
// ============================================

// Generic lookup types
export type LookupItem = z.infer<typeof lookupItemSchema>;
export type ExtendedLookupItem = z.infer<typeof extendedLookupItemSchema>;

// Specific lookup response types
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
export type CategoryLookupItem = z.infer<typeof categoryLookupItemSchema>;

export type TagResponse = z.infer<typeof tagResponseSchema>;
export type TagLookupItem = z.infer<typeof tagLookupItemSchema>;

export type OrganizationResponse = z.infer<typeof organizationResponseSchema>;
export type OrganizationLookupItem = z.infer<
  typeof organizationLookupItemSchema
>;

export type MinistryResponse = z.infer<typeof ministryResponseSchema>;
export type MinistryLookupItem = z.infer<typeof ministryLookupItemSchema>;

export type SystemUserResponse = z.infer<typeof systemUserResponseSchema>;
export type UserLookupItem = z.infer<typeof userLookupItemSchema>;

export type PitchStatusResponse = z.infer<typeof pitchStatusResponseSchema>;
export type PitchStatusLookupItem = z.infer<typeof pitchStatusLookupItemSchema>;

export type ActivityStatusResponse = z.infer<
  typeof activityStatusResponseSchema
>;
export type ActivityStatusLookupItem = z.infer<
  typeof activityStatusLookupItemSchema
>;

export type DateStatusResponse = z.infer<typeof dateStatusResponseSchema>;
export type DateStatusLookupItem = z.infer<typeof dateStatusLookupItemSchema>;

export type TimeStatusResponse = z.infer<typeof timeStatusResponseSchema>;
export type TimeStatusLookupItem = z.infer<typeof timeStatusLookupItemSchema>;

export type VenueStatusResponse = z.infer<typeof venueStatusResponseSchema>;
export type VenueStatusLookupItem = z.infer<typeof venueStatusLookupItemSchema>;

export type CityResponse = z.infer<typeof cityResponseSchema>;
export type CityLookupItem = z.infer<typeof cityLookupItemSchema>;

export type CommsMaterialsResponse = z.infer<
  typeof commsMaterialsResponseSchema
>;
export type CommsMaterialsLookupItem = z.infer<
  typeof commsMaterialsLookupItemSchema
>;

export type TranslationLanguageResponse = z.infer<
  typeof translationLanguageResponseSchema
>;
export type TranslationLanguageLookupItem = z.infer<
  typeof translationLanguageLookupItemSchema
>;

export type GovernmentRepresentativeResponse = z.infer<
  typeof governmentRepresentativeResponseSchema
>;
export type GovernmentRepresentativeLookupItem = z.infer<
  typeof governmentRepresentativeLookupItemSchema
>;

// Query params schema
export const lookupQueryParamsSchema = z.object({
  userId: z.coerce.number().int().optional(),
  role: z.string().optional(),
  organizationId: z.string().uuid().optional(),
});

export type LookupQueryParams = z.infer<typeof lookupQueryParamsSchema>;
