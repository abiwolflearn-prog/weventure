import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/authSlice';

// Compute API base URL from VITE_API_URL environment variable or default to Render production URL
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    if (cleanUrl.endsWith('/api/v1')) {
      return cleanUrl;
    }
    if (cleanUrl.endsWith('/api')) {
      return `${cleanUrl}/v1`;
    }
    return `${cleanUrl}/api/v1`;
  }
  return '/api/v1';
};

export const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to inject Tenant and Authorization headers dynamically
axiosInstance.interceptors.request.use(
  (config) => {
    // Check if custom tenant has been stored in local storage
    const tenantId = localStorage.getItem('weventure_tenant_id') || 'weventurehub';
    config.headers['X-Tenant-ID'] = tenantId;

    // Check if JWT token has been stored in local storage
    const token = localStorage.getItem('weventure_jwt_token');
    if (token && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else if (token === 'undefined' || token === 'null' || (token && !token.trim())) {
      localStorage.removeItem('weventure_jwt_token');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle standard API error responses
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Format error payload to ease component integration
    const apiError = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'A network error occurred while contacting our server.',
    };

    const status = error.response?.status;
    if (
      status === 401 ||
      apiError.code === 'UNAUTHORIZED' ||
      apiError.message === 'jwt expired' ||
      apiError.message === 'jwt malformed' ||
      apiError.message === 'Authentication token has expired'
    ) {
      localStorage.removeItem('weventure_jwt_token');
      store.dispatch(logout());
    }

    return Promise.reject(apiError);
  }
);
