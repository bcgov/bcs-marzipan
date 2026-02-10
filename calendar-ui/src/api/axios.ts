import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { createApiError } from './errors';

const api = axios.create({
  // Use /api prefix to go through Vite's proxy in development
  // In production, set VITE_API_BASE_URL in your environment
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000, // 30 seconds - increased to handle complex operations
  withCredentials: true, // Include httpOnly cookies in requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add correlation ID to outgoing requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Generate correlation ID if not present (for client-side tracking)
    // Server will generate its own if not provided
    if (!config.headers['X-Correlation-ID']) {
      config.headers['X-Correlation-ID'] = crypto.randomUUID();
    }
    return config;
  },
  (error: unknown) =>
    Promise.reject(error instanceof Error ? error : new Error(String(error)))
);

// Response interceptor: Handle errors and parse Problem Details
api.interceptors.response.use(
  (response) => {
    // Store correlation ID from response header for debugging
    const correlationId = response.headers['x-correlation-id'];
    if (correlationId && import.meta.env.DEV) {
      // Store in response data for potential use in components
      response.data._correlationId = correlationId;
    }
    return response;
  },
  (error: AxiosError) => {
    // On 401 Unauthorized, redirect to login (session expired/invalid)
    if (error.response?.status === 401) {
      // Don't redirect if already on login page
      if (!window.location.pathname.includes('/login')) {
        // Store current URL for post-login redirect
        sessionStorage.setItem(
          'returnTo',
          window.location.pathname + window.location.search
        );
        window.location.href = '/login';
      }
    }

    // Convert to typed ApiError or NetworkError
    const apiError = createApiError(error);
    return Promise.reject(apiError);
  }
);

export default api;
export { ApiError, NetworkError } from './errors';
