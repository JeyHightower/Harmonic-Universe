import{ createAsyncThunk } from '@reduxjs/toolkit';
import type { LoginRequest, AuthResponse } from '../../types/auth.ts';

export const loginUser = createAsyncThunk(
    'auth/login',
    async(credentials: LoginRequest, thunkAPI) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });
            const data = await response.json();
            if(!response.ok){
                return thunkAPI.rejectWithValue(data.Error || 'Login failed.');
            }
            return data as AuthResponse;
        } catch(error){
            return thunkAPI.rejectWithValue('Network error Occured.');
        }
    }
);


export const initializeAuth = createAsyncThunk(
    'auth/initialize',
    async(_, thunkAPI) => {
        const token = localStorage.getItem('token');
        if(!token) return thunkAPI.rejectWithValue('No token found.')

        try {
            const response = await fetch('/api/users/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (!response.ok){
                localStorage.removeItem('token');
                return thunkAPI.rejectWithValue('Session expired.');
            }
            return data as AuthResponse;
        } catch(error){
            return thunkAPI.rejectWithValue('Connection failed');
        }
    }
);