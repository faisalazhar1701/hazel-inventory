import { ApiClient } from '../lib/api-client';

// Backend has NO global prefix — use base URL as-is.
// If backend used app.setGlobalPrefix('api'), use: `${base}/api`
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hazel-inventory.onrender.com';

export const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

