import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../utils/api.js';
import { handleOfflineAuthentication, shouldUseFallback } from '../utils/authFallback';
import { AUTH_CONFIG } from '../utils/config.js';
import { loginFailure, loginStart, loginSuccess, updateUser } from './authSlice.js';

const handleError = error => {
    console.error('API Error:', error);
    return {
        message:
            error.response?.data?.message || error.message || 'An error occurred',
        status: error.response?.status,
        data: error.response?.data,
    };
};

// Login
export const login = createAsyncThunk(
    'auth/login',
    async (credentials, { dispatch, rejectWithValue }) => {
        try {
            dispatch(loginStart());
            console.debug('Logging in user:', credentials.email);

            const response = await apiClient.login(credentials);
            console.debug('Login successful:', response);

            // Store tokens
            localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.token);
            if (response.data.user) {
                localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(response.data.user));
            }

            dispatch(loginSuccess(response.data));
            return response.data;
        } catch (error) {
            console.error('Login failed:', error);

            // Check if we should use the fallback authentication
            if (shouldUseFallback(error)) {
                console.warn('Using offline authentication fallback for login');
                const fallbackData = handleOfflineAuthentication();

                // Store tokens from fallback
                localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, fallbackData.token);
                if (fallbackData.user) {
                    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(fallbackData.user));
                }

                dispatch(loginSuccess(fallbackData));
                return fallbackData;
            }

            // Regular error handling if fallback not used
            dispatch(loginFailure(handleError(error)));
            return rejectWithValue(handleError(error));
        }
    }
);

// Register
export const register = createAsyncThunk(
    'auth/register',
    async (userData, { dispatch, rejectWithValue }) => {
        try {
            console.debug('Registering user:', userData.email);

            const response = await apiClient.register(userData);
            console.debug('Registration successful:', response);

            // Store tokens
            localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.token);
            if (response.data.user) {
                localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(response.data.user));
            }

            dispatch(loginSuccess(response.data));
            return response.data;
        } catch (error) {
            console.error('Registration failed:', error);
            return rejectWithValue(handleError(error));
        }
    }
);

// Demo login
export const demoLogin = createAsyncThunk(
    'auth/demoLogin',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            dispatch(loginStart());
            console.debug('Logging in as demo user');

            try {
                // Try to directly use fallback authentication in development mode first
                if (process.env.NODE_ENV === 'development') {
                    console.debug('Using offline fallback authentication for demo login');
                    const fallbackData = handleOfflineAuthentication();

                    // Store tokens from fallback
                    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, fallbackData.token);
                    if (fallbackData.user) {
                        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(fallbackData.user));
                    }

                    dispatch(loginSuccess(fallbackData));
                    return fallbackData;
                }

                // If not in development mode, try the API endpoints
                let response;

                try {
                    console.debug('Trying demo login with API endpoint');
                    response = await apiClient.demoLogin({
                        credentials: 'include', // Include credentials for CORS
                    });
                    console.debug('Demo login successful with API endpoint:', response);
                } catch (err) {
                    console.debug('Demo login failed with API endpoint, trying fallback:', err);

                    // Check if we should use fallback authentication
                    if (shouldUseFallback(err)) {
                        console.warn('Using offline authentication fallback for demo login');
                        const fallbackData = handleOfflineAuthentication();

                        // Store tokens from fallback
                        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, fallbackData.token);
                        if (fallbackData.user) {
                            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(fallbackData.user));
                        }

                        dispatch(loginSuccess(fallbackData));
                        return fallbackData;
                    }

                    // Try fallback endpoint
                    console.debug('Trying fallback demo login endpoint /api/auth/demo-login');
                    try {
                        response = await apiClient.post('/api/auth/demo-login', {}, {
                            credentials: 'include', // Include credentials for CORS
                        });
                        console.debug('Demo login successful with fallback endpoint:', response);
                    } catch (err2) {
                        console.error('All demo login endpoints failed:', err, err2);

                        // Final check for fallback authentication
                        if (shouldUseFallback(err2)) {
                            console.warn('Using offline authentication fallback after all endpoints failed');
                            const fallbackData = handleOfflineAuthentication();

                            // Store tokens from fallback
                            localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, fallbackData.token);
                            if (fallbackData.user) {
                                localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(fallbackData.user));
                            }

                            dispatch(loginSuccess(fallbackData));
                            return fallbackData;
                        }

                        throw err2; // Throw the last error if fallback not used
                    }
                }

                // Store tokens
                localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.token);
                if (response.data.user) {
                    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(response.data.user));
                }

                dispatch(loginSuccess(response.data));
                return response.data;
            } catch (error) {
                // Final fallback attempt at the outer catch level
                if (shouldUseFallback(error)) {
                    console.warn('Using offline authentication fallback for demo login (outer catch)');
                    const fallbackData = handleOfflineAuthentication();

                    // Store tokens from fallback
                    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, fallbackData.token);
                    if (fallbackData.user) {
                        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(fallbackData.user));
                    }

                    dispatch(loginSuccess(fallbackData));
                    return fallbackData;
                }

                throw error; // Rethrow if not using fallback
            }
        } catch (error) {
            console.error('Demo login failed:', error);
            dispatch(loginFailure(handleError(error)));
            return rejectWithValue(handleError(error));
        }
    }
);

// Register a new user
export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData, { dispatch, rejectWithValue }) => {
        try {
            dispatch(loginStart());
            console.debug('Registering user:', userData);

            const response = await apiClient.register(userData);
            console.debug('Registration successful:', response);

            // Store tokens
            if (response.access_token) {
                localStorage.setItem('accessToken', response.access_token);
            }
            if (response.refresh_token) {
                localStorage.setItem('refreshToken', response.refresh_token);
            }

            // Dispatch login success with user data
            dispatch(loginSuccess(response.user || {}));

            return response;
        } catch (error) {
            console.error('Registration failed:', error);
            const errorData = handleError(error);
            dispatch(loginFailure(errorData.message));
            return rejectWithValue(errorData);
        }
    }
);

// Update user profile
export const updateUserProfile = createAsyncThunk(
    'auth/updateUserProfile',
    async (profileData, { dispatch, rejectWithValue }) => {
        try {
            console.debug('Updating user profile:', profileData);
            const response = await apiClient.updateUserProfile(profileData);
            console.debug('User profile updated:', response);

            // Update the user in the Redux store
            dispatch(updateUser(response));

            return response;
        } catch (error) {
            console.error('Failed to update user profile:', error);
            return rejectWithValue(handleError(error));
        }
    }
);

// Login user
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (loginData, { dispatch, rejectWithValue }) => {
        try {
            dispatch(loginStart());
            console.debug('Logging in user:', loginData);

            const response = await apiClient.login(loginData);
            console.debug('Login successful:', response);

            // Store tokens
            if (response.access_token) {
                localStorage.setItem('accessToken', response.access_token);
            }
            if (response.refresh_token) {
                localStorage.setItem('refreshToken', response.refresh_token);
            }

            // Dispatch login success with user data
            dispatch(loginSuccess(response.user || {}));

            return response;
        } catch (error) {
            console.error('Login failed:', error);
            const errorData = handleError(error);
            dispatch(loginFailure(errorData.message));
            return rejectWithValue(errorData);
        }
    }
);
