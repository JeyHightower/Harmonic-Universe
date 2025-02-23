// API configuration
export const endpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    demoLogin: '/api/auth/demo-login',
    refresh: '/api/auth/refresh',
  },
  universes: {
    list: '/api/universes',
    detail: id => `/api/universes/${id}`,
    create: '/api/universes',
    update: id => `/api/universes/${id}`,
    delete: id => `/api/universes/${id}`,
  },
};

// API client configuration
const defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
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
    } catch {
      error.response = {
        data: { message: response.statusText },
        status: response.status,
      };
      console.error('Could not parse error response');
    }
    throw error;
  }
  return response.json();
};

// API methods
export const api = {
  async get(endpoint) {
    const token = await getAuthToken();
    const headers = {
      ...defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    console.debug('GET Request:', { endpoint, headers });
    const response = await fetch(endpoint, { headers });
    return handleResponse(response);
  },

  async post(endpoint, data) {
    const token = await getAuthToken();
    const headers = {
      ...defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    console.debug('POST Request:', { endpoint, headers, data });
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  async put(endpoint, data) {
    const token = await getAuthToken();
    const headers = {
      ...defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    console.debug('PUT Request:', { endpoint, headers, data });
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  async delete(endpoint) {
    const token = await getAuthToken();
    const headers = {
      ...defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    console.debug('DELETE Request:', { endpoint, headers });
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers,
    });

    return handleResponse(response);
  },
};
