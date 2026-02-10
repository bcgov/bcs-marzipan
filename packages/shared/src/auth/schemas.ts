import { z } from 'zod';

/**
 * Zod schemas for auth request/response validation
 */

export const loginBodySchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().optional(), // Optional for mock auth; required for AD
});

export type LoginBody = z.infer<typeof loginBodySchema>;

export const authResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    username: z.string(),
    displayName: z.string(),
    email: z.string(),
    roleId: z.number(),
    roleName: z.string(),
    permissions: z.array(z.string()),
    teamIds: z.array(z.number()),
  }),
  accessToken: z.string(),
  expiresIn: z.number().optional(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
