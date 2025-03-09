import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('accessToken');

        // If token exists, add to headers
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If 401 error and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh token
                const refreshToken = localStorage.getItem('refreshToken');

                if (refreshToken) {
                    const response = await axios.post('/api/auth/refresh', {
                        refresh_token: refreshToken,
                    });

                    if (response.data.access_token) {
                        // Update token in localStorage
                        localStorage.setItem('accessToken', response.data.access_token);

                        // Update token in headers
                        api.defaults.headers.common.Authorization = `Bearer ${response.data.access_token}`;
                        originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;

                        // Retry original request
                        return api(originalRequest);
                    }
                }

                // If refresh failed, log out
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);

                // Log out on refresh failure
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Export API methods with better error handling
const apiClient = {
    get: async (url, config = {}) => {
        try {
            const response = await api.get(url, config);
            return response;
        } catch (error) {
            console.error(`GET ${url} failed:`, error);
            throw error;
        }
    },

    post: async (url, data = {}, config = {}) => {
        try {
            const response = await api.post(url, data, config);
            return response;
        } catch (error) {
            console.error(`POST ${url} failed:`, error);
            throw error;
        }
    },

    put: async (url, data = {}, config = {}) => {
        try {
            const response = await api.put(url, data, config);
            return response;
        } catch (error) {
            console.error(`PUT ${url} failed:`, error);
            throw error;
        }
    },

    delete: async (url, config = {}) => {
        try {
            const response = await api.delete(url, config);
            return response;
        } catch (error) {
            console.error(`DELETE ${url} failed:`, error);
            throw error;
        }
    },
};

export default apiClient;
