import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/authSlice';

export const axiosInstance = axios.create({
  baseURL: '/api/v1',
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
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
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
      apiError.message === 'Authentication token has expired'
    ) {
      localStorage.removeItem('weventure_jwt_token');
      store.dispatch(logout());
    }

    return Promise.reject(apiError);
  }
);
