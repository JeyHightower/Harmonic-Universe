import{ createAsyncThunk } from '@reduxjs/toolkit';
import type { LoginRequest, LoginResponse, RegisterResponse } from '../../types/auth.ts';
import type {AdminDraft, UserDraft } from '../../types/user.ts';
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
    async(credentials: UserDraft, thunkAPI) => {
        return await apiRequest<RegisterResponse>({
            url:'/api/auth/register',
            method: 'POST',
            signal: thunkAPI.signal,
            body: credentials,
            thunkAPI
        });
    }
)

export const registerAdmin = createAsyncThunk(
    'auth/register',
    async(credentials: AdminDraft, thunkAPI) => {
        return await apiRequest<RegisterResponse>({
            url:'/api/auth/register',
            method: 'POST',
            signal: thunkAPI.signal,
            body: credentials,
            thunkAPI
        });
    }
)


