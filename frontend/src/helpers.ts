import type { User } from "./types/user";
import type { ApiRequestConfig } from "./types/api";
import type { Universe } from "./types/universe";
import type { AuthState, LoginResponse, RegisterResponse } from "./types/auth";
import type { PayloadAction } from "@reduxjs/toolkit";


export const getInitialToken = ():string | null => {
    return localStorage.getItem('token')
};

export const getInitialUser = (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null
};

export const apiRequest = async <T> ({ url, method, body, thunkAPI, signal }: ApiRequestConfig):Promise<T | any>  => {
    const token = getInitialToken();
    if (!token && method !== 'POST') {
        return thunkAPI.rejectWithValue('No Authorization token found.');
    }
    try {
        const response = await fetch( url, {
            method,
            signal,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: method !== 'GET' ? JSON.stringify(body): undefined
        });
        const data = await response.json();
        if(!response.ok){
            if(response.status === 401) {
                localStorage.removeItem('token');
                return thunkAPI.rejectWithValue('Session expired. Please Login again ')
            }
            return thunkAPI.rejectWithValue(data.message || 'Request Failed.')
        }
        return data as T;

    } catch (error) {
        return thunkAPI.rejectWithValue('Network Connection failed. ')
    }
};

export const handleAuthSuccess = (state: AuthState, action: PayloadAction<LoginResponse | RegisterResponse> ) => {
    state.isLoading = false;
    state.isAuthenticated = true;
    state.user = action.payload.user;
    state.token = action.payload.token;
}

export const getCurrentUniverse = (): Universe | null => {
    const universeData = localStorage.getItem('current_universe');
    if(!universeData) return null;
    try{
        return JSON.parse(universeData) as Universe;
    } catch(error){
        console.log('failed to parse universe data', error);
        return null;
    }
}