/**
 * Authentication API functions
 * Works with httpOnly cookies - token is set/cleared by backend
 */
import type {
  AuthResponse,
  AuthUser,
  ChangePasswordBody,
  CheckEmailResponse,
  LoginBody,
  SetPasswordBody,
  VerifyResetCodeBody,
} from '@corpcal/shared';

import api from './axios';

export interface AzureConfigResponse {
  enabled: boolean;
}

export interface LocalConfigResponse {
  enabled: boolean;
  mockEnabled: boolean;
}

/** Possible shapes returned by POST /auth/login when strategy=local */
export type LoginResponse =
  | AuthResponse
  | { requiresPasswordSetup: true; email: string }
  | { requiresPasswordReset: true; email: string };

type SuccessEnvelope<T> = { success: true; data: T };

function unwrap<T>(payload: SuccessEnvelope<T>): T {
  return payload.data;
}

/**
 * Login with username (and optional password for mock/local auth)
 * Backend sets httpOnly cookie with JWT on success
 */
export async function login(credentials: LoginBody): Promise<LoginResponse> {
  const response = await api.post<SuccessEnvelope<LoginResponse>>(
    '/auth/login',
    credentials
  );
  return unwrap(response.data);
}

/**
 * Get current authenticated user
 * Uses httpOnly cookie automatically sent by browser
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const response = await api.get<SuccessEnvelope<AuthUser>>('/auth/me');
  return unwrap(response.data);
}

/**
 * Logout - clears httpOnly cookie on backend
 */
export async function logout(): Promise<void> {
  await api.post<SuccessEnvelope<{ message: string }>>('/auth/logout');
}

/**
 * Returns whether Azure AD login is enabled on the backend.
 */
export async function getAzureConfig(): Promise<AzureConfigResponse> {
  const response =
    await api.get<SuccessEnvelope<AzureConfigResponse>>('/auth/azure/config');
  return unwrap(response.data);
}

/**
 * Starts Azure AD login via browser redirect.
 */
export function startAzureLogin(): void {
  window.location.href = '/api/auth/azure';
}

// ---------------------------------------------------------------------------
// Local auth
// ---------------------------------------------------------------------------

/**
 * Returns whether local (email/password) login is enabled on the backend.
 */
export async function getLocalConfig(): Promise<LocalConfigResponse> {
  const response =
    await api.get<SuccessEnvelope<LocalConfigResponse>>('/auth/local/config');
  return unwrap(response.data);
}

/**
 * Step 1 of local login: check account status by email before asking for a password.
 */
export async function checkEmail(email: string): Promise<CheckEmailResponse> {
  const response = await api.post<SuccessEnvelope<CheckEmailResponse>>(
    '/auth/check-email',
    { email }
  );
  return unwrap(response.data);
}

/**
 * Set first-time password for a pending account (activates account).
 * Returns a message only — the user must log in separately after this step.
 */
export async function setPassword(
  body: SetPasswordBody
): Promise<{ message: string }> {
  const response = await api.post<SuccessEnvelope<{ message: string }>>(
    '/auth/set-password',
    body
  );
  return unwrap(response.data);
}

/**
 * Verify an admin-issued password reset code.
 */
export async function verifyResetCode(
  body: VerifyResetCodeBody
): Promise<{ valid: true }> {
  const response = await api.post<SuccessEnvelope<{ valid: true }>>(
    '/auth/verify-reset-code',
    body
  );
  return unwrap(response.data);
}

/**
 * Change password.
 * - Forced-reset flow: include tempToken.
 * - Voluntary change: the httpOnly cookie is sent automatically (no extra auth needed here).
 */
export async function changePassword(
  body: ChangePasswordBody
): Promise<AuthResponse | { message: string }> {
  const response = await api.post<
    SuccessEnvelope<AuthResponse | { message: string }>
  >('/auth/change-password', body);
  return unwrap(response.data);
}
