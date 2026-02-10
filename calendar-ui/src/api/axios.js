import axios from 'axios';

const api = axios.create({
  // Use /api prefix to go through Vite's proxy in development
  // In production, set VITE_API_BASE_URL in your environment
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000, // 30 seconds - increased to handle complex operations with multiple junction table inserts
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
