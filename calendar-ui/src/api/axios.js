import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // NestJS backend base URL
  timeout: 30000, // 30 seconds - increased to handle complex operations with multiple junction table inserts
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
