// Base API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const API_V1_URL = `${API_BASE_URL}/v1`;

// Auth endpoints
const authEndpoints = {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/signup`,
    demoLogin: `${API_BASE_URL}/auth/demo-login`,
    refresh: `${API_BASE_URL}/auth/refresh`,
    logout: `${API_BASE_URL}/auth/logout`,
    me: `${API_BASE_URL}/auth/me`,
};

// Versioned auth endpoints (for fallback)
const authV1Endpoints = {
    login: `${API_V1_URL}/auth/login`,
    register: `${API_V1_URL}/auth/signup`,
    demoLogin: `${API_V1_URL}/auth/demo-login`,
    refresh: `${API_V1_URL}/auth/refresh`,
    logout: `${API_V1_URL}/auth/logout`,
    me: `${API_V1_URL}/auth/me`,
};

// Export all endpoints
export const endpoints = {
    auth: authEndpoints,
    authV1: authV1Endpoints,
    // Add other endpoint groups as needed
};

// Export endpoint helper functions
export const getEndpoint = (group, name) => {
    if (!endpoints[group]) {
        console.error(`API endpoint group '${group}' not found`);
        return null;
    }

    if (!endpoints[group][name]) {
        console.error(`API endpoint '${name}' not found in group '${group}'`);
        return null;
    }

    return endpoints[group][name];
};
