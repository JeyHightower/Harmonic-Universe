const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const endpoints = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    me: `${API_BASE_URL}/api/auth/me`,
    demoLogin: `${API_BASE_URL}/api/auth/demo-login`,
  },
  universes: {
    list: `${API_BASE_URL}/api/universes`,
    detail: id => `${API_BASE_URL}/api/universes/${id}`,
    create: `${API_BASE_URL}/api/universes`,
    update: id => `${API_BASE_URL}/api/universes/${id}`,
    delete: id => `${API_BASE_URL}/api/universes/${id}`,
  },
};

export const handleResponse = async response => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'An error occurred');
  }
  return response.json();
};

export const api = {
  get: async url => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleResponse(response);
  },

  post: async (url, data) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  put: async (url, data) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async url => {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleResponse(response);
  },
};
