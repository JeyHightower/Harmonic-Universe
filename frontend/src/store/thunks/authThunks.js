import { createAsyncThunk } from '@reduxjs/toolkit';
import { api, endpoints } from '../../utils/api';
import { updateUser } from '../slices/authSlice';

const handleError = error => {
    console.error('API Error:', error);
    return {
        message:
            error.response?.data?.message || error.message || 'An error occurred',
        status: error.response?.status,
        data: error.response?.data,
    };
};

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
