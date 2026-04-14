import { z } from 'zod';

export const patchIdleTimeoutConfigSchema = z.object({
  idleTimeoutMinutes: z
    .number()
    .int()
    .min(1)
    .max(24 * 60),
});

export type PatchIdleTimeoutConfigBody = z.infer<
  typeof patchIdleTimeoutConfigSchema
>;
