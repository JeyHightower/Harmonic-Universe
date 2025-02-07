import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@store/index';
import axios from 'axios';

// Create our baseQuery instance
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  prepareHeaders: (headers, { getState }) => {
    // By default, if we have a token in the store, let's use that for authenticated requests
    const token = (getState() as RootState).auth.token;
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
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const response = await apiInstance.post('/api/auth/refresh');
        const { token } = response.data;
        localStorage.setItem('token', token);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout user
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.data?.message) {
      return Promise.reject(new Error(error.response.data.message));
    }

    return Promise.reject(error);
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
    detail: (id: number) => `/api/projects/${id}`,
    universes: (id: number) => `/api/projects/${id}/universes`,
    audio: (id: number) => `/api/projects/${id}/audio`,
    visualizations: (id: number) => `/api/projects/${id}/visualizations`,
  },
  universes: {
    base: '/api/universes',
    detail: (id: number) => `/api/universes/${id}`,
    physics: (id: number) => `/api/universes/${id}/physics`,
    harmony: (id: number) => `/api/universes/${id}/harmony`,
    story: (id: number) => `/api/universes/${id}/story`,
    export: (id: number) => `/api/universes/${id}/export`,
  },
  audio: {
    base: '/api/audio',
    tracks: '/api/audio/tracks',
    track: (id: number) => `/api/audio/tracks/${id}`,
    upload: (id: number) => `/api/audio/tracks/${id}/upload`,
    effects: (id: number) => `/api/audio/tracks/${id}/effects`,
  },
  visualizations: {
    base: '/api/visualizations',
    detail: (id: number) => `/api/visualizations/${id}`,
    data: (id: number) => `/api/visualizations/${id}/data`,
    stream: (id: number) => `/api/visualizations/${id}/stream`,
  },
};

export default apiInstance;
