import axios from 'axios';

const api = axios.create({
  // Use /api prefix to go through Vite's proxy in development
  // In production, set VITE_API_BASE_URL in your environment
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 5000, // optional: request timeout (ms)
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
