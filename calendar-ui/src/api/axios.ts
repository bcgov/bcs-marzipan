import axios from 'axios';

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

// Response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
    return Promise.reject(
      error instanceof Error ? error : new Error(String(error))
    );
  }
);

export default api;
