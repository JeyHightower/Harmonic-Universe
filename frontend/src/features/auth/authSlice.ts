import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type User } from '../../types/user';
import { type AuthResponse } from '../../types/auth';
import { loginUser, initializeAuth } from './authActions';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const getInitialToken = ():string | null => {
    return localStorage.getItem('token')
};

const getInitialUser = (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null
};

const initialState: AuthState = {
    user: getInitialUser(),
    token: getInitialToken(),
    isAuthenticated: !!getInitialToken(),
    isLoading: false,
    error: null,
};


const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout:(state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(loginUser.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('user', JSON.stringify(action.payload.user))
        })
        .addCase(loginUser.rejected, (state, action)=>{
            state.isLoading = false;
            state.isAuthenticated = false;
            state.error = action.payload as string;
        })
        .addCase(initializeAuth.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
            state.isLoading = false;
            state.user = action.payload.user;
            state.token = action.payload.token || state.token;
        })
        .addCase(initializeAuth.rejected, (state) => {
            state.isLoading = false;
            state.user = null;
            state.token = null;
        })
    }
})

export const { logout } = authSlice.actions;
export default authSlice.reducer;