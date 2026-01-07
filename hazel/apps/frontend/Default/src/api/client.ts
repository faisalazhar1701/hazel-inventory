import { ApiClient } from '@hazel/api-client';

// Create API client instance
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hazel-inventory.onrender.com';

export const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

