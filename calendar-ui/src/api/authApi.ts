/**
 * Authentication API functions
 * Works with httpOnly cookies - token is set/cleared by backend
 */
import api from './axios';
import type { AuthUser, AuthResponse, LoginBody } from '@corpcal/shared';

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
