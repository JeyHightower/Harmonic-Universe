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
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');

    // Log request data for debugging
    if (config.method === 'post' || config.method === 'put') {
      console.log(`API ${config.method.toUpperCase()} Request to ${config.url}:`, {
        headers: config.headers,
        data: config.data,
      });
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('API Request Setup Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiInstance.interceptors.response.use(
  response => {
    // Log successful responses for debugging
    console.log(`API Response from ${response.config.url}:`, {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  error => {
    if (error.response) {
      console.error('API Error Response:', {
        url: error.config.url,
        method: error.config.method,
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        requestData: error.config.data,
      });

      if (error.response.status === 422) {
        // Handle validation errors
        const validationErrors =
          error.response.data.error?.message ||
          error.response.data.error ||
          'Invalid data provided';
        throw new Error(validationErrors);
      }

      if (error.response.status === 401) {
        // Handle authentication errors
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Please log in to continue');
      }

      // Handle other error responses
      const errorMessage =
        error.response.data.error?.message || error.response.data.message || error.message;
      throw new Error(errorMessage || 'An error occurred');
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
