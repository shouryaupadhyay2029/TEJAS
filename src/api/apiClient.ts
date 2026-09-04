import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Authorization header using sessionStorage token
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('tejas_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized globally by clearing session and redirecting to /auth
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear invalid/expired session token
      sessionStorage.removeItem('tejas_access_token');
      
      // Redirect to /auth if not already on the login page
      if (window.location.pathname !== '/auth' && window.location.pathname !== '/login') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
