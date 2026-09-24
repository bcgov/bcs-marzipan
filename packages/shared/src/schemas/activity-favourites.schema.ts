import { z } from 'zod';

export const activityFavouritesDataSchema = z.object({
  activityIds: z.array(z.number().int()),
});

export type ActivityFavouritesData = z.infer<
  typeof activityFavouritesDataSchema
>;
