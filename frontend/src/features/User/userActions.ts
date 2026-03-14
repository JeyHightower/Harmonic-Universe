import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "../../helpers";
import type { LoginResponse } from "../../types/auth";
import type { UserDraft } from "../../types/user";
import type { User } from "../../types/user";

export const getProfile = createAsyncThunk(
    'auth/initialize',
    async(_, thunkAPI) => {
        return await apiRequest<LoginResponse>({
            url:'/api/users/me',
            signal: thunkAPI.signal,
            method: 'GET',
            thunkAPI
        });
    }
);

export const updateProfile  = createAsyncThunk(
    'user/update',
    async(profileData:UserDraft, thunkAPI) => {
        return await apiRequest<User>({
            url:'/api/users/me',
            method: 'PATCH',
            signal: thunkAPI.signal,
            body: profileData,
            thunkAPI
        });
    }
)

export const deleteUser = createAsyncThunk(
    'user/delete',
    async (userId: number, thunkAPI) => {
        return await apiRequest({
            url: `/api/users/${userId}`,
            method: 'DELETE',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)
