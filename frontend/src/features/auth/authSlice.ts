import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type User } from '../../types/user';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
}


const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ user: User; token: string }>
        ) => {
            const { user, token } = action.payload;
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
        },
        logOut: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setCredentials, logOut } = authSlice.actions;
export default authSlice.reducer;