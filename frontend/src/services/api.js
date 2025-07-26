import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  timeout: 10000,
  withCredentials: true
});

// Token management
let token = localStorage.getItem('token');

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      token = null;
      // Redirect to login if needed
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    if (response.data.token) {
      token = response.data.token;
      localStorage.setItem('token', token);
    }
    return response.data;
  },

  logout: () => {
    token = null;
    localStorage.removeItem('token');
  },

  getProfile: () => api.get('/api/auth/profile')
};

// Subscribers API
export const subscribersAPI = {
  getAll: (params = {}) => api.get('/api/subscribers', { params }),
  
  getById: (id) => api.get(`/api/subscribers/${id}`),
  
  create: (data) => api.post('/api/subscribers', data),
  
  update: (id, data) => api.put(`/api/subscribers/${id}`, data),
  
  delete: (id) => api.delete(`/api/subscribers/${id}`),
  
  search: (params) => api.get('/api/search/advanced', { params }),
  
  bulkSearch: (identifiers) => api.post('/api/search/bulk', { identifiers }),
  
  export: (params) => api.get('/api/search/export', { 
    params,
    responseType: 'blob'
  })
};

// Analytics API
export const analyticsAPI = {
  getDashboardStats: () => api.get('/api/analytics/dashboard'),
  
  getProviderStats: () => api.get('/api/analytics/providers'),
  
  getLocationStats: () => api.get('/api/analytics/locations'),
  
  getFraudStats: () => api.get('/api/analytics/fraud'),
  
  getUsageStats: (timeframe = '7d') => api.get(`/api/analytics/usage?timeframe=${timeframe}`)
};

// Upload API
export const uploadAPI = {
  bulkUpload: (formData, onProgress) => {
    return api.put('/api/upload/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
    });
  },

  getMappingSuggestions: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/upload/mapping-suggestions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  validateData: (data) => api.post('/api/upload/validate', data)
};

// Unified Search API
export const searchAPI = {
  unified: (params) => api.get('/api/unified/search', { params }),
  
  bulk: (identifiers) => api.post('/api/unified/bulk-search', { 
    identifiers: Array.isArray(identifiers) ? identifiers : [identifiers]
  }),
  
  geographic: (params) => api.get('/api/unified/geo-search', { params }),
  
  analytics: (params) => api.get('/api/unified/analytics', { params }),
  
  export: (params) => api.get('/api/unified/export', { 
    params,
    responseType: 'blob'
  })
};

// Health check
export const healthAPI = {
  check: () => api.get('/health')
};

export default api;
