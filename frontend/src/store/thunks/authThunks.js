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

            const response = await api.post(
                endpoints.auth.demoLogin,
                {}
            );
            console.debug('Demo login successful:', response);

            // Store tokens
            if (response.token) {
                localStorage.setItem('accessToken', response.token);
            }
            if (response.refresh_token) {
                localStorage.setItem('refreshToken', response.refresh_token);
            }

            // Dispatch login success with user data
            dispatch(loginSuccess(response.user));

            // Navigate to dashboard
            window.location.href = '/dashboard';

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
