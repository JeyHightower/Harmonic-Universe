import { createAsyncThunk } from '@reduxjs/toolkit';
import { api, endpoints } from '../../utils/api';
import { updateUser, loginSuccess, loginFailure, loginStart } from '../slices/authSlice';

const handleError = error => {
    console.error('API Error:', error);
    return {
        message:
            error.response?.data?.message || error.message || 'An error occurred',
        status: error.response?.status,
        data: error.response?.data,
    };
};

// Demo login
export const demoLogin = createAsyncThunk(
    'auth/demoLogin',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            dispatch(loginStart());
            console.debug('Logging in as demo user');

            // Try the demo login server first
            let response;

            try {
                console.debug('Trying demo login with API endpoint');
                response = await api.post(endpoints.auth.demoLogin, {}, {
                    credentials: 'include', // Include credentials for CORS
                });
                console.debug('Demo login successful with API endpoint:', response);
            } catch (err) {
                console.debug('Demo login failed with API endpoint, trying fallback:', err);

                // Try fallback endpoint
                console.debug('Trying fallback demo login endpoint /api/auth/demo-login');
                try {
                    response = await api.post('/api/auth/demo-login', {}, {
                        credentials: 'include', // Include credentials for CORS
                    });
                    console.debug('Demo login successful with fallback endpoint:', response);
                } catch (err2) {
                    console.error('All demo login endpoints failed:', err, err2);
                    throw err2; // Throw the last error
                }
            }

            // Store tokens - handle different response formats
            if (response.token) {
                localStorage.setItem('accessToken', response.token);
            }
            if (response.access_token) {
                localStorage.setItem('accessToken', response.access_token);
            }
            if (response.refresh_token) {
                localStorage.setItem('refreshToken', response.refresh_token);
            }

            // Fetch user info if not included in response
            let userData = response.user;
            if (!userData) {
                try {
                    const userResponse = await api.get(endpoints.auth.me);
                    userData = userResponse;
                } catch (error) {
                    console.error('Failed to fetch user info:', error);
                }
            }

            // Dispatch login success with user data
            dispatch(loginSuccess(userData || {}));

            return response;
        } catch (error) {
            console.error('Demo login failed:', error);
            const errorData = handleError(error);
            dispatch(loginFailure(errorData.message));
            return rejectWithValue(errorData);
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

            const response = await api.post(
                endpoints.auth.register,
                userData
            );
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
            const response = await api.put(
                endpoints.auth.me,
                profileData
            );
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

            const response = await api.post(
                endpoints.auth.login,
                loginData
            );
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
