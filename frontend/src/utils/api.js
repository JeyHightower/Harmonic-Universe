const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const endpoints = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    logout: `${API_BASE_URL}/auth/logout`,
    me: `${API_BASE_URL}/auth/me`,
  },
  universes: {
    list: `${API_BASE_URL}/universes`,
    detail: id => `${API_BASE_URL}/universes/${id}`,
    create: `${API_BASE_URL}/universes`,
    update: id => `${API_BASE_URL}/universes/${id}`,
    delete: id => `${API_BASE_URL}/universes/${id}`,
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
