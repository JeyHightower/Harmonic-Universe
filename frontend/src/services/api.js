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
  timeout: 10000,
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
  response => response,
  async error => {
    const originalRequest = error.config;

    // If error response is undefined, it's a network error
    if (!error.response) {
      return Promise.reject(new Error('Network error - please check your connection'));
    }

    // If the error is not 401 or it's a refresh token request or we've already tried to refresh
    if (
      error.response.status !== 401 ||
      originalRequest.url.includes('/refresh') ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        isRefreshing = false;
        // Clear auth state since we can't refresh
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete apiInstance.defaults.headers.common['Authorization'];
        window.dispatchEvent(new CustomEvent('auth:failed', {
          detail: { error: 'No refresh token available' }
        }));
        return Promise.reject(error);
      }

      try {
        const response = await apiInstance.post('/api/auth/refresh', {
          refresh_token: refreshToken,
          access_token: localStorage.getItem('token') // Include current access token
        });

        const { access_token, refresh_token } = response.data;

        localStorage.setItem('token', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        apiInstance.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        originalRequest._retry = true;

        processQueue(null, access_token);
        return apiInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Clear auth state
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete apiInstance.defaults.headers.common['Authorization'];

        // Dispatch auth failed event
        window.dispatchEvent(new CustomEvent('auth:failed', {
          detail: {
            error: refreshError.response?.data || refreshError.message
          }
        }));

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Add request to queue if we're already refreshing
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(token => {
      originalRequest.headers['Authorization'] = `Bearer ${token}`;
      return apiInstance(originalRequest);
    }).catch(err => {
      return Promise.reject(err);
    });
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
