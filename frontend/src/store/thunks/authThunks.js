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
            let error;

            try {
                console.debug('Trying demo login with demo server on port 5001');
                response = await fetch('http://localhost:5001/api/auth/demo-login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Demo server responded with status: ${response.status}`);
                }

                response = await response.json();
                console.debug('Demo login successful with demo server:', response);
            } catch (err) {
                console.debug('Demo login failed with demo server, trying alternative endpoint:', err);
                error = err;

                // If the demo server fails, try the main app endpoint
                try {
                    console.debug('Trying demo login with /api/auth/demo-login endpoint');
                    response = await api.post(
                        '/api/auth/demo-login',
                        {}
                    );
                    console.debug('Demo login successful with /api/auth/demo-login:', response);
                } catch (err2) {
                    console.debug('Demo login failed with /api/auth/demo-login, trying blueprint endpoint');

                    // If the main app endpoint fails, try the blueprint endpoint
                    try {
                        console.debug('Trying demo login with blueprint endpoint');
                        response = await api.post(
                            endpoints.auth.demoLogin,
                            {}
                        );
                        console.debug('Demo login successful with blueprint endpoint:', response);
                    } catch (err3) {
                        console.error('All demo login endpoints failed:', err, err2, err3);
                        throw err3; // Throw the last error
                    }
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

            // Dispatch login success with user data
            if (response.user) {
                dispatch(loginSuccess(response.user));
            } else {
                console.warn('No user data in response, using empty user object');
                dispatch(loginSuccess({}));
            }

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
            dispatch(loginSuccess(response.user));

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
