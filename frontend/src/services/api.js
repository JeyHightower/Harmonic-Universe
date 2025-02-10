import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import axios from 'axios';

// Create our baseQuery instance
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  prepareHeaders: (headers, { getState }) => {
    // By default, if we have a token in the store, let's use that for authenticated requests
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Create our API instance
export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Audio', 'Physics', 'Visualization', 'AI'],
  endpoints: () => ({}),
});

// Export hooks for usage in components
export const {
  util: { getRunningQueriesThunk },
} = api;

const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
apiInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiInstance.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // If the error is not 401 or it's a refresh token request that failed
    if (error.response?.status !== 401 || originalRequest.url === '/api/auth/refresh') {
      return Promise.reject(error);
    }

    // If we're already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiInstance(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }

    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiInstance.post('/api/auth/refresh', {
        refresh_token: refreshToken,
      });

      const { access_token } = response.data;
      localStorage.setItem('token', access_token);

      // Update authorization header
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      apiInstance.defaults.headers.common.Authorization = `Bearer ${access_token}`;

      processQueue(null, access_token);
      return apiInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Clear auth state
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      // Redirect to login
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// API endpoints
export const endpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    user: '/api/auth/user',
  },
  projects: {
    base: '/api/projects',
    detail: id => `/api/projects/${id}`,
    universes: id => `/api/projects/${id}/universes`,
    audio: id => `/api/projects/${id}/audio`,
    visualizations: id => `/api/projects/${id}/visualizations`,
  },
  universes: {
    base: '/api/universes',
    detail: id => `/api/universes/${id}`,
    physics: id => `/api/universes/${id}/physics`,
    harmony: id => `/api/universes/${id}/harmony`,
    story: id => `/api/universes/${id}/story`,
    export: id => `/api/universes/${id}/export`,
  },
  audio: {
    base: '/api/audio',
    tracks: '/api/audio/tracks',
    track: id => `/api/audio/tracks/${id}`,
    upload: id => `/api/audio/tracks/${id}/upload`,
    effects: id => `/api/audio/tracks/${id}/effects`,
  },
  visualizations: {
    base: '/api/visualizations',
    detail: id => `/api/visualizations/${id}`,
    data: id => `/api/visualizations/${id}/data`,
    stream: id => `/api/visualizations/${id}/stream`,
  },
};

export default apiInstance;
