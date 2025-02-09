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
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response);

      if (error.response.status === 422) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        throw new Error(
          validationErrors ? Object.values(validationErrors).flat().join(', ') : 'Validation failed'
        );
      }

      if (error.response.status === 401) {
        // Handle authentication errors
        localStorage.removeItem('token');
        throw new Error('Please log in to continue');
      }

      throw new Error(error.response.data.message || 'An error occurred');
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error:', error.request);
      throw new Error('No response from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Setup Error:', error.message);
      throw new Error('Error setting up request');
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
