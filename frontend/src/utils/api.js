import { API_CONFIG } from './config';

// API configuration
export const endpoints = {
  auth: {
    login: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/auth/login`,
    register: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/auth/register`,
    logout: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/auth/logout`,
    me: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/auth/me`,
    demoLogin: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/auth/demo-login`,
    refresh: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/auth/refresh`,
  },
  universes: {
    list: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/`,
    detail: id => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${id}/`,
    create: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/`,
    update: id => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${id}/`,
    delete: id => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${id}/`,
    physics: id => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${id}/physics/`,
    harmony: id => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${id}/harmony/`,
  },
  scenes: {
    list: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/`,
    detail: id => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/${id}`,
    create: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/`,
    update: id => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/${id}`,
    delete: id => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/${id}`,
    reorder: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/reorder`,
    forUniverse: universeId => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/?universe_id=${universeId}`,
    physicsParameters: {
      list: sceneId =>
        `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/${sceneId}/physics_parameters`,
      detail: (sceneId, paramsId) =>
        `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/${sceneId}/physics_parameters/${paramsId}`,
      create: sceneId =>
        `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/${sceneId}/physics_parameters`,
      update: (sceneId, paramsId) =>
        `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/${sceneId}/physics_parameters/${paramsId}`,
      delete: (sceneId, paramsId) =>
        `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/${sceneId}/physics_parameters/${paramsId}`,
    },
    harmonyParameters: {
      list: sceneId =>
        `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/${sceneId}/harmony_parameters`,
      detail: (sceneId, paramsId) =>
        `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/${sceneId}/harmony_parameters/${paramsId}`,
      create: sceneId =>
        `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/${sceneId}/harmony_parameters`,
      update: (sceneId, paramsId) =>
        `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/${sceneId}/harmony_parameters/${paramsId}`,
      delete: (sceneId, paramsId) =>
        `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/scenes/${sceneId}/harmony_parameters/${paramsId}`,
    },
  },
  physicsObjects: {
    list: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/physics-objects/`,
    detail: id => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/physics-objects/${id}`,
    create: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/physics-objects/`,
    update: id => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/physics-objects/${id}`,
    delete: id => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/physics-objects/${id}`,
    forScene: sceneId =>
      `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/physics-objects/?scene_id=${sceneId}`,
  },
  music: {
    generate: universeId => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/music/${universeId}/generate`,
    download: universeId => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/music/${universeId}/download`,
    generateAI: universeId =>
      `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/music/${universeId}/generate-ai`,
  },
  storyboards: {
    list: (universeId) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universeId}/storyboards`,
    get: (universeId, storyboardId) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universeId}/storyboards/${storyboardId}`,
    create: (universeId) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universeId}/storyboards`,
    update: (universeId, storyboardId) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universeId}/storyboards/${storyboardId}`,
    delete: (universeId, storyboardId) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universeId}/storyboards/${storyboardId}`,

    points: {
      list: (universeId, storyboardId) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universeId}/storyboards/${storyboardId}/points`,
      get: (universeId, storyboardId, pointId) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universeId}/storyboards/${storyboardId}/points/${pointId}`,
      create: (universeId, storyboardId) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universeId}/storyboards/${storyboardId}/points`,
      update: (universeId, storyboardId, pointId) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universeId}/storyboards/${storyboardId}/points/${pointId}`,
      delete: (universeId, storyboardId, pointId) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universeId}/storyboards/${storyboardId}/points/${pointId}`
    }
  }
};

// API client configuration
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Default fetch options for CORS
const defaultFetchOptions = {
  credentials: 'include', // Include credentials (cookies) in cross-origin requests
  mode: 'cors', // Enable CORS mode
};

// Helper function to check if token is valid
const isTokenValid = token => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isValid = payload.exp * 1000 > Date.now();
    console.debug('Token validity check:', {
      isValid,
      exp: new Date(payload.exp * 1000),
    });
    return isValid;
  } catch (e) {
    console.error('Error checking token validity:', e);
    return false;
  }
};

// Helper to get auth token
const getAuthToken = async () => {
  console.debug('Getting auth token');
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.debug('No access token found');
    return null;
  }

  // Check if token is valid
  if (!isTokenValid(token)) {
    console.debug('Access token expired, attempting refresh');
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken || !isTokenValid(refreshToken)) {
        console.debug('No valid refresh token found');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return null;
      }

      // Attempt to refresh token
      console.debug('Attempting to refresh token');
      const response = await fetch(endpoints.auth.refresh, {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      console.debug('Token refreshed successfully');
      localStorage.setItem('accessToken', data.access_token);
      return data.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return null;
    }
  }

  console.debug('Using existing valid token');
  return token;
};

// Error handler
const handleResponse = async response => {
  console.debug('Processing response:', {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    console.error('API request failed:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });

    const error = new Error('API request failed');
    try {
      const data = await response.json();
      error.response = { data, status: response.status };
      console.error('Error response data:', data);
    } catch (parseError) {
      console.error('Could not parse error response:', parseError);
      error.response = {
        data: { message: response.statusText },
        status: response.status,
      };
    }
    throw error;
  }

  // Return null for 204 No Content responses
  if (response.status === 204) {
    console.debug('Received 204 No Content response');
    return null;
  }

  try {
    console.debug('Parsing JSON response');
    const data = await response.json();
    console.debug('Successfully parsed JSON response:', data);
    return data;
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    throw new Error('Invalid JSON response from server');
  }
};

// API methods
export const api = {
  async get(endpoint, options = {}) {
    const token = await getAuthToken();
    const headers = {
      ...defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    console.debug('GET Request:', {
      endpoint,
      headers: {
        ...headers,
        Authorization: token ? 'Bearer [REDACTED]' : 'None',
      },
    });
    const response = await fetch(endpoint, {
      ...defaultFetchOptions,
      headers,
      signal: options.signal,
    });
    return handleResponse(response);
  },

  async post(endpoint, data, options = {}) {
    const token = await getAuthToken();
    const headers = {
      ...defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    console.debug('POST Request:', {
      endpoint,
      headers: {
        ...headers,
        Authorization: token ? 'Bearer [REDACTED]' : 'None',
      },
      data,
    });

    try {
      console.debug('Sending POST fetch request to:', endpoint);
      const response = await fetch(endpoint, {
        ...defaultFetchOptions,
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('POST request failed:', error);
      throw error;
    }
  },

  async put(endpoint, data, options = {}) {
    const token = await getAuthToken();
    const headers = {
      ...defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    console.debug('PUT Request:', {
      endpoint,
      headers: {
        ...headers,
        Authorization: token ? 'Bearer [REDACTED]' : 'None',
      },
      data,
    });

    try {
      const response = await fetch(endpoint, {
        ...defaultFetchOptions,
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('PUT request failed:', error);
      throw error;
    }
  },

  async delete(endpoint, options = {}) {
    const token = await getAuthToken();
    const headers = {
      ...defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    console.debug('DELETE Request:', {
      endpoint,
      headers: {
        ...headers,
        Authorization: token ? 'Bearer [REDACTED]' : 'None',
      },
    });

    try {
      const response = await fetch(endpoint, {
        ...defaultFetchOptions,
        method: 'DELETE',
        headers,
      });
      return handleResponse(response);
    } catch (error) {
      console.error('DELETE request failed:', error);
      throw error;
    }
  },

  async patch(endpoint, data, options = {}) {
    const token = await getAuthToken();
    const headers = {
      ...defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    console.debug('PATCH Request:', {
      endpoint,
      headers: {
        ...headers,
        Authorization: token ? 'Bearer [REDACTED]' : 'None',
      },
      data,
    });

    try {
      const response = await fetch(endpoint, {
        ...defaultFetchOptions,
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('PATCH request failed:', error);
      throw error;
    }
  },
};
