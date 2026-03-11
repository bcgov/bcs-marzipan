/**
 * Authentication API functions
 * Works with httpOnly cookies - token is set/cleared by backend
 */
import type { AuthResponse, AuthUser, LoginBody } from '@corpcal/shared';

import api from './axios';

export interface AzureConfigResponse {
  enabled: boolean;
}

/**
 * Login with username (and optional password for mock auth)
 * Backend sets httpOnly cookie with JWT on success
 */
export async function login(credentials: LoginBody): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  return response.data;
}

/**
 * Get current authenticated user
 * Uses httpOnly cookie automatically sent by browser
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const response = await api.get<AuthUser>('/auth/me');
  return response.data;
}

/**
 * Logout - clears httpOnly cookie on backend
 */
export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

/**
 * Returns whether Azure AD login is enabled on the backend.
 */
export async function getAzureConfig(): Promise<AzureConfigResponse> {
  const response = await api.get<AzureConfigResponse>('/auth/azure/config');
  return response.data;
}

/**
 * Starts Azure AD login via browser redirect.
 */
export function startAzureLogin(): void {
  window.location.href = '/api/auth/azure';
}
