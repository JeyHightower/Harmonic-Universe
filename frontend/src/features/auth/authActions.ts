import{ createAsyncThunk } from '@reduxjs/toolkit';
import type { LoginRequest, LoginResponse } from '../../types/auth.ts';
import type { User } from '../../types/user.ts';
import { apiRequest } from '../../helpers.ts';

export const loginUser = createAsyncThunk(
    'auth/login',
    async(credentials: LoginRequest, thunkAPI) => {
        return await apiRequest<LoginResponse>({
            url: '/api/auth/login',
            method: 'POST',
            signal:thunkAPI.signal,
            body: credentials,
            thunkAPI
        });
    }
)


export const registerUser = createAsyncThunk(
    'auth/register',
    async(credentials: User, thunkAPI) => {
        return await apiRequest<User>({
            url:'/api/auth/register',
            method: 'POST',
            signal: thunkAPI.signal,
            body: credentials,
            thunkAPI
        });
    }
)



export const initializeAuth = createAsyncThunk(
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