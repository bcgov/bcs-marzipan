import { z } from 'zod';

export const acquireLockBodySchema = z.object({
  entityType: z.literal('activity'),
  entityId: z.number().int().positive(),
  lockSessionId: z.string().max(100).optional(),
});

export type AcquireLockBody = z.infer<typeof acquireLockBodySchema>;
