import { z } from 'zod';

/**
 * Zod schemas for auth request/response validation
 */

export const loginBodySchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().optional(), // Optional for mock auth; required for local/AD
});

export type LoginBody = z.infer<typeof loginBodySchema>;

// ---------------------------------------------------------------------------
// Local auth — step-by-step login schemas
// ---------------------------------------------------------------------------

export const checkEmailBodySchema = z.object({
  email: z.string().trim().email('Valid email is required'),
});

export type CheckEmailBody = z.infer<typeof checkEmailBodySchema>;

/**
 * POST /auth/check-email status contract.
 *
 * Anti-enumeration: unknown addresses return `inactive` (same as deactivated).
 * UI must not suggest Microsoft for generic `inactive` — only for `sso_recommended`.
 *
 * - `active` — password login
 * - `pending` — set initial password (includes active + directLoginEnabled, no hash)
 * - `requires_reset` — admin reset code flow
 * - `sso_recommended` — known active SSO-only user (no password, directLogin off)
 * - `inactive` — deactivated, unknown email, or not eligible for local login
 */
export type CheckEmailStatus =
  | 'active'
  | 'pending'
  | 'requires_reset'
  | 'sso_recommended'
  | 'inactive';

export interface CheckEmailResponse {
  status: CheckEmailStatus;
  email?: string;
}

export const setPasswordBodySchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  confirmPassword: z.string(),
});

export type SetPasswordBody = z.infer<typeof setPasswordBodySchema>;

export const verifyResetCodeBodySchema = z.object({
  email: z.string().email('Valid email is required'),
  resetCode: z.string().min(1, 'Reset code is required'),
});

export type VerifyResetCodeBody = z.infer<typeof verifyResetCodeBodySchema>;

export const changePasswordBodySchema = z.object({
  // Forced reset flow: supply tempToken (admin-issued reset code)
  tempToken: z.string().optional(),
  // Voluntary change: supply currentPassword (requires Bearer token)
  currentPassword: z.string().optional(),
  newPassword: z.string().min(12, 'Password must be at least 12 characters'),
  confirmPassword: z.string(),
});

export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;

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
