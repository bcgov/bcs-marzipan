import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // NestJS backend base URL
  timeout: 5000, // optional: request timeout (ms)
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
